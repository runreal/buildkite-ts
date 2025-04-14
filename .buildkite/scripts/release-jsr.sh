#!/bin/sh

# Check if we have a tag
if [ -z "${BUILDKITE_TAG:-}" ]; then
  echo "No tag found. This step should only run on tag creation."
  exit 1
fi

# Get the current version from deno.json
CURRENT_VERSION=$(echo "import file from './deno.json' with { type: 'json' }; console.log(file.version);" | deno run -)

# Get the tag version (remove 'v' prefix if present)
TAG_VERSION=${BUILDKITE_TAG#v}

# Verify versions match
if [ "$CURRENT_VERSION" != "$TAG_VERSION" ]; then
  echo "Version mismatch:"
  echo "  deno.json version: $CURRENT_VERSION"
  echo "  Git tag version:   $TAG_VERSION"
  echo "Please ensure the version in deno.json matches the git tag."
  exit 1
fi

# Get JSR token from Buildkite secret
JSR_TOKEN=$(buildkite-agent secret get "JSR_TOKEN")

# Publish to JSR
echo "Publishing version $CURRENT_VERSION to JSR..."
deno publish --token $JSR_TOKEN --dry-run
