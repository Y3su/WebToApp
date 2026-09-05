# Android runtime preview

Kotlin/AndroidX WebView shell with HTTPS navigation, verified exact origins, TLS
failure cancellation, denied native permissions, and an origin/main-frame
checked message listener. The listener returns capability-disabled errors; no
privileged method is implemented yet.

With JDK 17, Android SDK 36 and Gradle 8.13:

```sh
gradle -p runtimes/android :app:testDebugUnitTest :app:assembleDebug :app:bundleRelease
```

The checked-in AppSpec uses the reserved example domain for development only.
Replace it with an authorized, validated revision when generating a customer
project. Release signing, push, OAuth callbacks, uploads/downloads, deep links,
and emulator acceptance remain in M2. No signing configuration is stored here.
