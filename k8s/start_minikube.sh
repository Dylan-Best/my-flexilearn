#!/bin/bash

#minikube delete parfois

# Démarre Minikube en montant la configuration de chiffrement directement dans l'API Server
minikube start --driver=docker \
  --extra-config=apiserver.encryption-provider-config=/etc/kubernetes/encryption-config.yaml \
  --mount-string='{"apiVersion":"apiserver.config.k8s.io/v1","kind":"EncryptionConfiguration","resources":[{"resources":["secrets"],"providers":[{"aescbc":{"keys":[{"name":"key1","secret":"ltzALoDRVcqNYDNnSwbzIyqQ8QyucNdv7o3PmaomGSg="}]}},{"identity":{}}]}]}'
