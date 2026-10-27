# infra/ — GCP (Terraform) para el quishing-lab

Crea una VM + IP estática en GCP, con el cloud-init ya cableado (Docker, repo,
`.env` con `ADMIN_TOKEN` aleatorio y `LAN_IP` = IP reservada). Tras el apply la
VM queda **apagada pero preparada**: para la práctica solo la enciendes.

## Costes

Default `e2-small` (2 GB) para una práctica de ~2 días con créditos de GCP:
**~$1 de crédito** en total (VM ~$0.9 + IP reservada ~$0.24 + disco ~$0.05).
Con `e2-medium` (4 GB) serían ~$2 — igualmente trivial sobre $20.

Si la dejaras meses encendida en `e2-micro` (us-central1), entraría en el free
tier ($0 compute). Ojo: una IP reservada sin usar cuesta ~$3.6/mes aunque la
VM esté apagada; `terraform destroy` libera VM, disco e IP al terminar.

## Uso

```bash
cd infra

gcloud auth application-default login
terraform init

cp terraform.tfvars.example terraform.tfvars
# edita: project (obligatorio) y, si puedes, acota ssh_source_ranges

# Crea todo y deja la VM APAGADA:
terraform apply

# Para la práctica: enciende la VM
terraform apply -var="vm_running=true"
# (o: gcloud compute instances start quishing-lab --zone=us-central1-a)

# Espera ~3 min a que el cloud-init termine (primera vez):
#   gcloud compute ssh quishing-lab --zone=us-central1-a -- tail -f /var/log/cloud-init-output.log
# luego:
terraform output admin_url        # panel (también expón con el perfil `tunnel` de compose)
```

## Fin de la práctica (borrarlo todo)

```bash
terraform destroy          # libera la IP reservada, la VM y el disco
```

o, si solo quieres apagar de nuevo: `terraform apply -var="vm_running=false"`.

## CI/CD (deploy automático al mergear a main/master)

El workflow `.github/workflows/deploy.yml` hace SSH a la VM, `git pull` y
`docker compose up -d --build`. Requiere dos secrets en el repo de GitHub
(*Settings → Secrets and variables → Actions*):

- `DEPLOY_HOST`: la IP estática (`terraform output static_ip`).
- `DEPLOY_SSH_KEY`: llave **privada** generada así y subida a la VM:

```bash
ssh-keygen -t ed25519 -f deploy_key -N "" -C "gh-actions-deploy"
gcloud compute instances add-metadata quishing-lab \
  --zone=us-central1-a \
  --metadata="ssh-keys=ubuntu:$(cat deploy_key.pub)"
# copia el contenido de deploy_key (privada) al secret DEPLOY_SSH_KEY
```

(La llave pública solo autoriza `git pull` + `docker compose` — es lo mismo
que puede hacer cualquiera con acceso al repo, que es público; para un lab de
2 días es suficiente.)
