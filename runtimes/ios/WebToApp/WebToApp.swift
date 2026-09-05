import SwiftUI
import WebKit

@main
struct WebToApp: App {
    var body: some Scene {
        WindowGroup { RuntimeView() }
    }
}

struct RuntimeView: View {
    @State private var errorMessage: String?
    @State private var reloadID = UUID()

    var body: some View {
        VStack {
            if let errorMessage { Text(errorMessage).accessibilityLabel(errorMessage) }
            Button("Reload") { reloadID = UUID(); errorMessage = nil }
            if let resource = Bundle.main.url(forResource: "appspec", withExtension: "json"),
               let data = try? Data(contentsOf: resource), data.count <= 262144,
               let spec = try? AppSpecV1(data: data),
               let start = spec.source.startURL.flatMap(URL.init(string:)),
               spec.source.kind == .url,
               let policy = try? OriginPolicy(origins: spec.navigation.allowedOrigins,
                                             verifiedDomains: Set(spec.ownership.verifiedDomains)),
               policy.allows(start) {
                RestrictedWebView(start: start, policy: policy, errorMessage: $errorMessage)
                    .id(reloadID)
            } else {
                Text("The bundled application configuration is invalid.")
            }
        }
    }
}

struct RestrictedWebView: UIViewRepresentable {
    let start: URL
    let policy: OriginPolicy
    @Binding var errorMessage: String?

    func makeCoordinator() -> Coordinator { Coordinator(policy: policy, errorMessage: $errorMessage) }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = false
        configuration.mediaTypesRequiringUserActionForPlayback = .all
        // No script message handlers or native command bridge are registered in this preview.
        let web = WKWebView(frame: .zero, configuration: configuration)
        web.navigationDelegate = context.coordinator
        web.uiDelegate = context.coordinator
        web.load(URLRequest(url: start))
        return web
    }

    func updateUIView(_ view: WKWebView, context: Context) {}

    static func dismantleUIView(_ view: WKWebView, coordinator: Coordinator) {
        view.stopLoading()
        view.navigationDelegate = nil
        view.uiDelegate = nil
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        let policy: OriginPolicy
        @Binding var errorMessage: String?
        init(policy: OriginPolicy, errorMessage: Binding<String?>) {
            self.policy = policy
            self._errorMessage = errorMessage
        }

        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = action.request.url, policy.allows(url) else {
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!,
                     withError error: Error) {
            errorMessage = "Unable to connect. Check your connection and reload."
        }

        func webView(_ webView: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin,
                     initiatedByFrame frame: WKFrameInfo, type: WKMediaCaptureType,
                     decisionHandler: @escaping (WKPermissionDecision) -> Void) {
            decisionHandler(.deny)
        }
    }
}
