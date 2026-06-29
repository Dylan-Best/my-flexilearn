# 1. Génère et écrit le fichier de chiffrement directement dans la VM Minikube
minikube ssh "sudo mkdir -p /etc/kubernetes && echo 'apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
  - resources:
      - secrets
    providers:
      - aescbc:
          keys:
            - name: key1
              secret: ltzALoDRVcqNYDNnSwbzIyqQ8QyucNdv7o3PmaomGSg=
      - identity: {}' | sudo tee /etc/kubernetes/encryption-config.yaml > /dev/null"


