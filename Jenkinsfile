#!groovy

@Library('basis-pipeline-library@BASIS-24357') _

def propFrontendImageTag = frontendImageTag
def propDoDeploy = doDeploy
def rancherConfigName = rancherConfigName
def rancherEnvironment = rancherEnvironment
def rancherStack = rancherStack
def rancherService = rancherService

pipelineBuildFrontendJavascript {
    agentLabel = 'docker-engine'
    dockerRegistry = 'basis-registry.basis.com.br'
    builderImageName = 'basis-registry.basis.com.br/basis/builder-image'
    builderImageTag = 'node-8.9.3'
    buildScriptPath = 'docker/nginx/build.sh'
    dockerContext = 'docker/nginx'
    frontendImageName = 'abaco/abaco-ui'
    frontendImageTag = propFrontendImageTag
    doDeploy = propDoDeploy
    rancherInfo = [
        configName: rancherConfigName,
        environment: rancherEnvironment,
        stack: rancherStack,
        service: rancherService
    ]
    rocketChannel = ''
    recipientList = ''
    sendSuccessNotification = false
}

