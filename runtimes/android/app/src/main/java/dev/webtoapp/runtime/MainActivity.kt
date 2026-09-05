package dev.webtoapp.runtime

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.net.http.SslError
import android.os.Bundle
import android.webkit.*
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import org.json.JSONObject
import java.io.ByteArrayInputStream

class MainActivity : Activity() {
    private lateinit var web: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val spec = assets.open("appspec.json").use {
            val bytes = it.readBytes()
            require(bytes.size <= 262144)
            JSONObject(bytes.toString(Charsets.UTF_8))
        }
        require(spec.getString("schemaVersion") == "1.0")
        val source = spec.getJSONObject("source")
        require(source.getString("kind") == "url")
        val origins = spec.getJSONObject("navigation").getJSONArray("allowedOrigins")
        val domains = spec.getJSONObject("ownership").getJSONArray("verifiedDomains")
        val policy = OriginPolicy(
            (0 until origins.length()).map { origins.getString(it) },
            (0 until domains.length()).map { domains.getString(it) }.toSet(),
        )
        val startUrl = source.getString("startUrl")
        require(policy.allows(startUrl))
        val layout = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        val status = TextView(this)
        val retry = Button(this).apply { text = "Reload" }
        web = WebView(this)
        layout.addView(status)
        layout.addView(retry)
        layout.addView(web, LinearLayout.LayoutParams(-1, 0, 1f))
        setContentView(layout)
        retry.setOnClickListener { web.loadUrl(startUrl) }
        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = false
            allowContentAccess = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            javaScriptCanOpenWindowsAutomatically = false
            setSupportMultipleWindows(false)
            mediaPlaybackRequiresUserGesture = true
        }
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, false)
        web.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) = request.deny()
            override fun onGeolocationPermissionsShowPrompt(origin: String, callback: GeolocationPermissions.Callback) {
                callback.invoke(origin, false, false)
            }
        }
        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                if (policy.allows(request.url.toString())) return false
                if (request.isForMainFrame && request.hasGesture() &&
                    OriginPolicy.origin(request.url.toString()) != null &&
                    spec.getJSONObject("navigation").optString("externalLinks") == "system") {
                    runCatching { startActivity(Intent(Intent.ACTION_VIEW, request.url).addCategory(Intent.CATEGORY_BROWSABLE)) }
                }
                return true
            }
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
                if (request.url.scheme == "https") return null
                return WebResourceResponse("text/plain", "UTF-8", 403, "Blocked", emptyMap(), ByteArrayInputStream(byteArrayOf()))
            }
            override fun onReceivedSslError(view: WebView, handler: SslErrorHandler, error: SslError) = handler.cancel()
            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                if (request.isForMainFrame) status.text = "Unable to connect. Check your connection and reload."
            }
            override fun onPageFinished(view: WebView, url: String) { if (policy.allows(url)) status.text = "" }
        }
        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            WebViewCompat.addWebMessageListener(web, "webtoapp", policy.allowedOrigins) { _, message, origin, isMainFrame, reply ->
                if (!isMainFrame || !policy.allows(origin.toString())) return@addWebMessageListener
                val data = message.data ?: return@addWebMessageListener
                if (data.toByteArray().size > 262144) return@addWebMessageListener
                runCatching {
                    val request = JSONObject(data)
                    val id = request.getString("id")
                    val method = request.getString("method")
                    require(id.length <= 128 && method.length <= 80)
                    reply.postMessage(JSONObject().put("id", id).put("method", method).put("ok", false)
                        .put("error", JSONObject().put("code", "capability_disabled")
                            .put("message", "Native capabilities are unavailable in this preview.")).toString())
                }
            }
        }
        web.loadUrl(startUrl)
    }

    override fun onDestroy() {
        if (::web.isInitialized) { web.stopLoading(); web.destroy() }
        super.onDestroy()
    }
}
