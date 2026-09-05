package dev.webtoapp.runtime

import java.net.URI

class OriginPolicy(origins: List<String>, verifiedDomains: Set<String>) {
    val allowedOrigins: Set<String> = origins.toSet()
    init {
        require(allowedOrigins.isNotEmpty())
        require(allowedOrigins.all {
            val uri = URI(it)
            origin(it) == it && uri.host in verifiedDomains
        }) { "Only exact verified HTTPS origins are accepted" }
    }

    fun allows(url: String): Boolean = origin(url) in allowedOrigins

    companion object {
        fun origin(value: String): String? = try {
            val uri = URI(value)
            if (uri.scheme != "https" || uri.rawUserInfo != null || uri.host == null ||
                uri.host != uri.host.lowercase() || uri.port !in listOf(-1, 443)) null
            else "https://" + uri.host
        } catch (_: Exception) { null }
    }
}
