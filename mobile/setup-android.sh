#!/usr/bin/env bash
# Installs JDK 17 + Android SDK into ~/android-build (no admin needed). Safe to re-run.
set -euo pipefail
ROOT="$HOME/android-build"; mkdir -p "$ROOT"; cd "$ROOT"

if [ ! -d "$ROOT/jdk/Contents/Home" ]; then
  echo "==> JDK 17 (Temurin, aarch64)"
  curl -fL -o jdk.tar.gz "https://api.adoptium.net/v3/binary/latest/17/ga/mac/aarch64/jdk/hotspot/normal/eclipse"
  mkdir -p jdk && tar -xzf jdk.tar.gz -C jdk --strip-components=1 && rm jdk.tar.gz
fi
export JAVA_HOME="$ROOT/jdk/Contents/Home"; export PATH="$JAVA_HOME/bin:$PATH"
java -version

if [ ! -d "$ROOT/sdk/cmdline-tools/latest" ]; then
  echo "==> Android command-line tools"
  curl -fL -o cmdtools.zip "https://dl.google.com/android/repository/commandlinetools-mac-11076708_latest.zip"
  mkdir -p sdk/cmdline-tools && unzip -q cmdtools.zip -d sdk/cmdline-tools && mv sdk/cmdline-tools/cmdline-tools sdk/cmdline-tools/latest && rm cmdtools.zip
fi
export ANDROID_HOME="$ROOT/sdk"
yes | "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --licenses >/dev/null || true
"$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" "platforms;android-34" "build-tools;34.0.0" "platform-tools"
echo "SETUP_DONE"
