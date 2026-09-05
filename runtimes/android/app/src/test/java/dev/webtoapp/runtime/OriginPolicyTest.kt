package dev.webtoapp.runtime

import org.junit.Assert.*
import org.junit.Test

class OriginPolicyTest {
    private val policy = OriginPolicy(listOf("https://example.com"), setOf("example.com"))
    @Test fun allowsPaths() { assertTrue(policy.allows("https://example.com/app?q=1")) }
    @Test fun blocksOriginConfusion() {
        listOf("http://example.com", "https://example.com@evil.test", "https://sub.example.com", "file:///x", "https://example.com:8443").forEach {
            assertFalse(it, policy.allows(it))
        }
    }
    @Test(expected = IllegalArgumentException::class)
    fun requiresVerification() { OriginPolicy(listOf("https://example.com"), emptySet()) }
}
