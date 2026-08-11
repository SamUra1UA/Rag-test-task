# Розгортання `ai-agent-for-employee`

> Деплой на спільний Kubernetes-кластер `NULP-AI-Enterprise` (GHCR, Sealed
> Secrets, Traefik, ArgoCD auto-sync) — ті самі конвенції, що й для інших
> сервісів організації. Домен для цього проєкту — **`ai-solutions.art`**
> (не спільний `thesis-i.com`).

| Параметр | Значення |
|----------|----------|
| Namespace | `ai-agent-for-employee` |
| Домен (frontend) | `ai-agent-for-employee.ai-solutions.art` |
| Домен (backend API) | `ai-agent-for-employee-api.ai-solutions.art` |
| Образ frontend | `ghcr.io/nulp-ai-enterprise/ai-agent-for-employee-frontend` |
| Образ backend | `ghcr.io/nulp-ai-enterprise/ai-agent-for-employee-backend` |
| Порти | frontend `3000`, backend `8000` |
| Health endpoints | `GET /api/health` (frontend), `GET /health` (backend) |
| Манифести | `k8s/` — готові до `kubectl apply` |

### Відхилення від загальних конвенцій org

1. **Два окремих Deployment**, не один — frontend (Next.js) і backend
   (FastAPI) — самостійні сервіси з окремими образами й health-check'ами,
   схоже на `zzk-register`/`zzk-front`, а не на комбінований `personal-crm`.
2. **Chroma замість Postgres** — векторна БД для RAG, той самий паттерн
   (`StatefulSet` + headless `Service` + PVC), просто інший образ.
3. **`NEXT_PUBLIC_API_URL` — build-arg, не k8s env var.** Next.js вбудовує
   `NEXT_PUBLIC_*` у клієнтський бандл під час `next build`, тож значення
   задається в CI (`--build-arg`), а не в `frontend-deployment.yaml`. Зміна
   backend-URL означає новий build образу, а не редагування Deployment.

---

## 1. Перелік манифестів (`k8s/`)

| Файл | Що створює | Нотатки |
|------|-----------|---------|
| `namespace.yaml` | `Namespace ai-agent-for-employee` | |
| `chroma.yaml` | `StatefulSet` + headless `Service` + PVC 2Gi | векторна БД, without persistence RAG-індекс зникає при рестарті |
| `backend-deployment.yaml` | `Deployment` + `Service` + PVC 1Gi (audit-лог) | non-root (`uid 1001`), `securityContext.fsGroup: 1001` для запису в PVC |
| `frontend-deployment.yaml` | `Deployment` + `Service` | non-root (Next.js standalone) |
| `ingress.yaml` | один `Ingress` з двома `rules` (frontend + backend) | обидва хости — однолабельні піддомени `ai-solutions.art`, покриті wildcard |
| `secret.example.yaml` | шаблон `Secret` | **не** застосовувати напряму — див. §2 |
| `argocd-app.yaml` | `Application` в `argocd` | застосовується один раз вручну |

Манифести перевірені `kubeconform -strict -ignore-missing-schemas
-kubernetes-version 1.30.0` (`-ignore-missing-schemas` — бо ArgoCD `Application`
не входить у стандартний набір схем k8s, це очікувано).

---

## 2. Секрет

`ai-agent-secret` (namespace `ai-agent-for-employee`):

| Ключ | Призначення |
|------|------------|
| `OPENAI_API_KEY` | ключ для ембедингів (завжди) і генерації відповідей (якщо `LLM_PROVIDER=openai`, за замовчуванням) |

Решта конфігурації (`OPENAI_CHAT_MODEL`, `LLM_PROVIDER`, `CHROMA_HOST`,
`AUDIT_LOG_PATH`) — несекретна, прописана прямо в `backend-deployment.yaml`.

```bash
cp k8s/secret.example.yaml k8s/secret.yaml    # k8s/secret.yaml у .gitignore
$EDITOR k8s/secret.yaml                        # вставити реальний OPENAI_API_KEY

kubectl config set-cluster nulp-k8s-2 --server=https://100.107.206.16:6443
kubeseal --format yaml --controller-name=sealed-secrets-controller --controller-namespace=kube-system \
  < k8s/secret.yaml > k8s/sealed-secret.yaml
```

Комітити **лише** `k8s/sealed-secret.yaml`.

---

## 3. Збірка і push образів

CI (`.github/workflows/docker-build.yml`) збирає **два** образи з двох
контекстів одного репозиторію і пінує обидва теги в своїх `k8s/*-deployment.yaml`.
Job `build-frontend` явно залежить від `build-backend` (`needs:`), щоб їхні
коміти з пінованим тегом ніколи не гонялися за пушем одночасно.

| Job | Контекст | Образ |
|-----|----------|-------|
| `build-backend` | `./backend` | `ghcr.io/nulp-ai-enterprise/ai-agent-for-employee-backend` |
| `build-frontend` | `./frontend` | `ghcr.io/nulp-ai-enterprise/ai-agent-for-employee-frontend` |

Вручну (якщо без CI):

```bash
export ORG=nulp-ai-enterprise TAG=sha-$(git rev-parse --short=7 HEAD)

docker build -t ghcr.io/$ORG/ai-agent-for-employee-backend:$TAG ./backend
docker build -t ghcr.io/$ORG/ai-agent-for-employee-frontend:$TAG \
  --build-arg NEXT_PUBLIC_API_URL=https://ai-agent-for-employee-api.ai-solutions.art \
  ./frontend

docker push ghcr.io/$ORG/ai-agent-for-employee-backend:$TAG
docker push ghcr.io/$ORG/ai-agent-for-employee-frontend:$TAG
```

---

## 4. Перший деплой — покроково

```bash
# 1. Секрет (§2 вище)
cp k8s/secret.example.yaml k8s/secret.yaml && $EDITOR k8s/secret.yaml
kubectl config set-cluster nulp-k8s-2 --server=https://100.107.206.16:6443
kubeseal --format yaml --controller-name=sealed-secrets-controller --controller-namespace=kube-system \
  < k8s/secret.yaml > k8s/sealed-secret.yaml

# 2. ghcr-secret у новому namespace (один раз)
kubectl create namespace ai-agent-for-employee
kubectl create secret docker-registry ghcr-secret \
  --namespace=ai-agent-for-employee \
  --docker-server=ghcr.io \
  --docker-username=<github-username> \
  --docker-password=<github-pat-with-read-packages>

# 3. Зареєструвати в ArgoCD (один раз)
kubectl apply -f k8s/argocd-app.yaml

# 4. Пуш — CI збере обидва образи і запінує теги
git add . && git commit -m "feat: ai-agent-for-employee initial deployment" && git push

# 5. Перевірити
kubectl get pods -n ai-agent-for-employee
curl -sS https://ai-agent-for-employee-api.ai-solutions.art/health
curl -sS https://ai-agent-for-employee.ai-solutions.art/api/health
```

**DNS/TLS:** `ai-solutions.art` — новий домен для цього проєкту, не
`thesis-i.com`. Перш ніж чекати на успішний TLS-хендшейк, переконайтесь, що:
- DNS для `ai-agent-for-employee.ai-solutions.art` і
  `ai-agent-for-employee-api.ai-solutions.art` вказує на кластер (той самий
  публічний IP/LoadBalancer, що обслуговує `*.thesis-i.com`);
- на Traefik є ACME/сертифікат, що покриває `*.ai-solutions.art` (або окремі
  сертифікати на ці два хости) — це окремий домен, тож наявний сертифікат для
  `thesis-i.com` його не покриває.

---

## 5. Чекліст перед пушем

- [ ] `k8s/secret.yaml` є в `.gitignore` (уже додано)
- [ ] `k8s/sealed-secret.yaml` згенеровано і закомічено
- [ ] `ghcr-secret` існує в namespace `ai-agent-for-employee`
- [ ] DNS для обох хостів `*.ai-solutions.art` налаштований, TLS покриває їх
- [ ] `kubeconform -strict -ignore-missing-schemas k8s/*.yaml` проходить без `Invalid`
- [ ] `docker build` для обох сервісів проходить локально (перевірено — див. історію збірок)

---

## 6. Діагностика

```bash
kubectl get pods -n ai-agent-for-employee
kubectl logs -n ai-agent-for-employee deploy/ai-agent-backend --tail=100
kubectl logs -n ai-agent-for-employee deploy/ai-agent-frontend --tail=100
kubectl describe pod -n ai-agent-for-employee -l app=ai-agent-backend
kubectl get application ai-agent-for-employee -n argocd
```

| Симптом | Причина | Виправлення |
|---------|---------|-------------|
| `ImagePullBackOff` | `ghcr-secret` відсутній | `kubectl create secret docker-registry ghcr-secret --namespace=ai-agent-for-employee ...` |
| Backend `CrashLoopBackOff`, лог "OPENAI_API_KEY" | секрет не запечатано/не застосовано | перевірити `k8s/sealed-secret.yaml` і що `ai-agent-secret` існує в namespace |
| Чат повертає 500, у логах `openai.AuthenticationError` | невірний/протермінований `OPENAI_API_KEY` | оновити секрет, перезапечатати, застосувати |
| RAG "не знаходить" усе підряд | Chroma PVC порожній (перший старт) або под ще не `Ready` | `kubectl get pods -n ai-agent-for-employee`, дочекатись `chroma-0` Running |
| `503`/timeout на будь-якому хості `*.ai-solutions.art` | DNS не вказує на кластер, або TLS не покриває новий домен | див. §4 "DNS/TLS" |
| `Постійний OutOfSync` на StatefulSet `chroma` | дефолти `volumeClaimTemplates` | `ignoreDifferences` уже є в `k8s/argocd-app.yaml` |
| `[rejected] fetch first` при пуші | CI-боти обох job запінували образи, поки ти працював | `git pull --rebase origin main && git push` |
