# iOS runtime preview

SwiftUI/WKWebView URL shell consuming the generated Swift AppSpec model. It
denies off-origin navigation and media permissions and registers no native
command bridge. App Transport Security retains its platform defaults.

On a customer-controlled Mac with Xcode and XcodeGen:

```sh
cd runtimes/ios
xcodegen generate
xcodebuild -project WebToApp.xcodeproj -scheme WebToApp -sdk iphonesimulator CODE_SIGNING_ALLOWED=NO build
```

The privacy manifest describes only this shell. Customer site data collection
must be disclosed separately before distribution. APNs, Universal Links, OAuth,
archive/export validation, signing and device acceptance remain in M6.
