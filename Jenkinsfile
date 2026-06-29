pipeline {
    agent any

    environment {
        // Remplace par ton vrai pseudo Docker Hub
        DOCKER_HUB_USER   = 'dylanleboss' 
        BACKEND_IMAGE     = "${DOCKER_HUB_USER}/flexilearn-backend"
        FRONTEND_IMAGE    = "${DOCKER_HUB_USER}/flexilearn-frontend"
        IMAGE_TAG         = "${env.BRANCH_NAME}-${env.BUILD_NUMBER}"
        KUBECONFIG        = "/var/jenkins_home/.kube/config"
    }

    stages {
        stage('SAST Security Scan') {
            steps {
                echo 'Analyse du code source Python...'
                sh 'pip install bandit --break-system-packages || true'
                sh 'bandit -r /backend -f txt -o bandit-sast-report.txt || true'
            }
        }

        stage('Build App Images') {
            steps {
                echo "Building des images avec le tag ${IMAGE_TAG}..."
                sh "docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} ./backend"
                sh "docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} ./frontend"
            }
        }

        stage(' Push to Docker Hub') {
            steps {
                // 'dockerhub-credentials' correspond à l'ID créé dans Jenkins
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', 
                                                 usernameVariable: 'DOCKER_USER', 
                                                 passwordVariable: 'DOCKER_PASS')]) {
                    echo 'Connexion sécurisée à Docker Hub...'
                    sh 'if [ -z "$DOCKER_USER" ]; then echo "DOCKER_USER est VIDE"; else echo "DOCKER_USER est CHARGÉ"; fi'
                    sh "echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin"
                    
                    echo 'Publication des images...'
                    sh "docker push ${BACKEND_IMAGE}:${IMAGE_TAG}"
                    sh "docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}"
                }
            }
        }

        stage(' Continuous Deployment') {
           when {
                // anyOf doit contenir une liste de conditions branch individuelles
                anyOf {
                    branch 'main'
                    branch 'dev'
                    branch 'master'
                }
            }
            steps {
                echo "Verification si le packet envsubst .."
                sh 'apt-get update && apt-get install -y gettext'
                echo "Déploiement de l'image Docker Hub sur Minikube..."
                sh "./scripts/deploy.sh ${IMAGE_TAG}"
            }
        }
    }

    post {
        always {
            echo "Nettoyage : Déconnexion de Docker Hub et suppression des images locales..."
            sh "docker logout"
            sh "docker rmi ${BACKEND_IMAGE}:${IMAGE_TAG} || true"
            sh "docker rmi ${FRONTEND_IMAGE}:${IMAGE_TAG} || true"
        }
    }
}