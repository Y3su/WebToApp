package dev.webtoapp.contract

/**
 * Immutable, cross-platform input to a WebToApp build.
 */
data class AppSpecV1 (
    val branding: Branding,
    val capabilities: Capabilities,
    val compliance: Compliance,
    val identity: Identity,
    val navigation: Navigation,
    val ownership: Ownership,
    val release: Release,
    val schemaVersion: SchemaVersion,
    val source: Source,
    val targets: Targets
)

data class Branding (
    val backgroundColor: String,
    val iconURL: String,
    val primaryColor: String,
    val splash: Splash? = null
)

data class Splash (
    val backgroundColor: String,
    val imageURL: String? = null
)

data class Capabilities (
    val camera: Camera,
    val files: Files,
    val location: Camera,
    val microphone: Camera,
    val notifications: Camera,
    val push: Push,
    val share: Camera
)

data class Camera (
    val enabled: Boolean,
    val rationale: String? = null
)

data class Files (
    val downloads: Boolean? = null,
    val enabled: Boolean,
    val rationale: String? = null,
    val uploads: Boolean? = null
)

data class Push (
    val enabled: Boolean,
    val rationale: String? = null,
    val tokenEndpoint: String? = null
)

data class Compliance (
    val accountDeletionURL: String? = null,
    val ageRating: AgeRating,
    val dataPractices: List<DataPractice>,
    val privacyPolicyURL: String,
    val reviewerNotes: String? = null,
    val supportURL: String
)

enum class AgeRating {
    The12,
    The17,
    The4,
    The9
}

enum class DataPractice {
    Account,
    Contact,
    Diagnostics,
    Financial,
    Health,
    Identifiers,
    Location,
    Usage,
    UserContent
}

data class Identity (
    val buildNumber: Long,
    val displayName: String,
    val platformIdentifiers: PlatformIdentifiers,
    val slug: String,
    val version: String
)

data class PlatformIdentifiers (
    val android: String? = null,
    val ios: String? = null,
    val linux: String? = null,
    val macos: String? = null,
    val windows: String? = null
)

data class Navigation (
    val allowedOrigins: List<String>,
    val externalLinks: ExternalLinks,
    val native: Native,
    val oauthOrigins: List<String>
)

enum class ExternalLinks {
    Block,
    ExternalLinksSystem
}

data class Native (
    val items: List<AppSpecV>,
    val mode: Mode
)

data class AppSpecV (
    val icon: String? = null,
    val id: String,
    val label: String,
    val url: String
)

enum class Mode {
    None,
    Sidebar,
    Tabs
}

data class Ownership (
    val verificationRecordIDS: List<String>,
    val verifiedDomains: List<String>
)

data class Release (
    val channel: Channel,
    val updatePolicy: UpdatePolicy
)

enum class Channel {
    Beta,
    Internal,
    Stable
}

enum class UpdatePolicy {
    Manual,
    SignedFeed,
    Store
}

enum class SchemaVersion {
    The10
}

data class Source (
    val kind: Kind,
    val startURL: String? = null,
    val artifactSha256: String? = null
)

enum class Kind {
    Static,
    URL
}

data class Targets (
    val android: Android? = null,
    val ios: Ios? = null,
    val linux: Linux? = null,
    val macos: Macos? = null,
    val windows: Windows? = null
)

data class Android (
    val formats: List<AndroidFormat>,
    val minSDK: Long,
    val signingReferenceID: String? = null,
    val targetAPI: Long
)

enum class AndroidFormat {
    Aab,
    Apk
}

data class Ios (
    val formats: List<IosFormat>,
    val minVersion: String,
    val signingReferenceID: String? = null
)

enum class IosFormat {
    Archive,
    Ipa,
    Xcode
}

data class Linux (
    val architectures: List<LinuxArchitecture>,
    val formats: List<LinuxFormat>,
    val signingReferenceID: String? = null
)

enum class LinuxArchitecture {
    Arm64,
    X64
}

enum class LinuxFormat {
    Appimage,
    Deb
}

data class Macos (
    val architectures: List<MacosArchitecture>,
    val formats: List<MacosFormat>,
    val minVersion: String,
    val signingReferenceID: String? = null
)

enum class MacosArchitecture {
    Arm64,
    Universal,
    X64
}

enum class MacosFormat {
    App,
    Dmg
}

data class Windows (
    val architectures: List<LinuxArchitecture>,
    val formats: List<WindowsFormat>,
    val minVersion: String,
    val signingReferenceID: String? = null
)

enum class WindowsFormat {
    Msix,
    Nsis
}
