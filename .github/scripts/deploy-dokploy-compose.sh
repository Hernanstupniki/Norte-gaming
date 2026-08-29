#!/usr/bin/env bash
set -Eeuo pipefail

for required_name in DOKPLOY_URL DOKPLOY_COMPOSE_ID DOKPLOY_API_KEY HEALTHCHECK_URLS GITHUB_REPOSITORY GITHUB_SHA; do
  if [[ -z "${!required_name:-}" ]]; then
    echo "Missing required deployment configuration: ${required_name}" >&2
    exit 1
  fi
done

dokploy_base="${DOKPLOY_URL%/}"
deployment_title="GitHub Actions ${GITHUB_REPOSITORY}@${GITHUB_SHA}"
payload="$(jq -cn \
  --arg composeId "$DOKPLOY_COMPOSE_ID" \
  --arg title "$deployment_title" \
  --arg description "Published GHCR image sha-${GITHUB_SHA}" \
  '{composeId: $composeId, title: $title, description: $description}')"

before_ids="$(curl --fail-with-body --silent --show-error \
  --connect-timeout 10 --max-time 30 --retry 2 --retry-all-errors \
  --get --data-urlencode "composeId=${DOKPLOY_COMPOSE_ID}" \
  "${dokploy_base}/api/deployment.allByCompose" \
  -H "x-api-key: ${DOKPLOY_API_KEY}" | jq -ce '[.[].deploymentId]')"

enqueue_response="$(curl --fail-with-body --silent --show-error \
  --connect-timeout 10 --max-time 30 --retry 2 --retry-all-errors \
  -X POST "${dokploy_base}/api/compose.deploy" \
  -H "x-api-key: ${DOKPLOY_API_KEY}" \
  -H "Content-Type: application/json" \
  --data "$payload")"

jq -e '.success == true' <<<"$enqueue_response" >/dev/null

deployment_id=""
deployment_status=""

for _ in $(seq 1 90); do
  deployments="$(curl --fail-with-body --silent --show-error \
    --connect-timeout 10 --max-time 30 --retry 2 --retry-all-errors \
    --get --data-urlencode "composeId=${DOKPLOY_COMPOSE_ID}" \
    "${dokploy_base}/api/deployment.allByCompose" \
    -H "x-api-key: ${DOKPLOY_API_KEY}")"

  if [[ -z "$deployment_id" ]]; then
    deployment_id="$(jq -er --argjson before "$before_ids" \
      '[.[] | select(.deploymentId as $id | ($before | index($id) | not))] | sort_by(.createdAt) | last | .deploymentId // empty' \
      <<<"$deployments" 2>/dev/null || true)"
  fi

  if [[ -n "$deployment_id" ]]; then
    deployment_status="$(jq -er --arg id "$deployment_id" \
      '[.[] | select(.deploymentId == $id)][0].status // empty' \
      <<<"$deployments" 2>/dev/null || true)"
  fi

  case "$deployment_status" in
    done)
      break
      ;;
    error|cancelled)
      echo "Dokploy deployment finished with status: ${deployment_status}" >&2
      exit 1
      ;;
  esac

  sleep 10
done

if [[ "$deployment_status" != "done" ]]; then
  echo "Dokploy deployment did not reach a successful terminal state before timeout" >&2
  exit 1
fi

for health_url in $HEALTHCHECK_URLS; do
  curl --fail-with-body --silent --show-error --location \
    --connect-timeout 10 --max-time 20 --retry 12 --retry-delay 10 \
    --retry-all-errors --retry-connrefused \
    --output /dev/null "$health_url"
done

echo "Dokploy deployment and public health verification succeeded"
