// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let appSpecV1 = try AppSpecV1(json)

import Foundation

/// Immutable, cross-platform input to a WebToApp build.
// MARK: - AppSpecV1
public struct AppSpecV1: Codable {
    public let branding: Branding
    public let capabilities: Capabilities
    public let compliance: Compliance
    public let identity: Identity
    public let navigation: Navigation
    public let ownership: Ownership
    public let release: Release
    public let schemaVersion: SchemaVersion
    public let source: Source
    public let targets: Targets

    public init(branding: Branding, capabilities: Capabilities, compliance: Compliance, identity: Identity, navigation: Navigation, ownership: Ownership, release: Release, schemaVersion: SchemaVersion, source: Source, targets: Targets) {
        self.branding = branding
        self.capabilities = capabilities
        self.compliance = compliance
        self.identity = identity
        self.navigation = navigation
        self.ownership = ownership
        self.release = release
        self.schemaVersion = schemaVersion
        self.source = source
        self.targets = targets
    }
}

// MARK: AppSpecV1 convenience initializers and mutators

public extension AppSpecV1 {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(AppSpecV1.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        branding: Branding? = nil,
        capabilities: Capabilities? = nil,
        compliance: Compliance? = nil,
        identity: Identity? = nil,
        navigation: Navigation? = nil,
        ownership: Ownership? = nil,
        release: Release? = nil,
        schemaVersion: SchemaVersion? = nil,
        source: Source? = nil,
        targets: Targets? = nil
    ) -> AppSpecV1 {
        return AppSpecV1(
            branding: branding ?? self.branding,
            capabilities: capabilities ?? self.capabilities,
            compliance: compliance ?? self.compliance,
            identity: identity ?? self.identity,
            navigation: navigation ?? self.navigation,
            ownership: ownership ?? self.ownership,
            release: release ?? self.release,
            schemaVersion: schemaVersion ?? self.schemaVersion,
            source: source ?? self.source,
            targets: targets ?? self.targets
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - Branding
public struct Branding: Codable {
    public let backgroundColor: String
    public let iconURL: String
    public let primaryColor: String
    public let splash: Splash?

    public enum CodingKeys: String, CodingKey {
        case backgroundColor
        case iconURL = "iconUrl"
        case primaryColor, splash
    }

    public init(backgroundColor: String, iconURL: String, primaryColor: String, splash: Splash?) {
        self.backgroundColor = backgroundColor
        self.iconURL = iconURL
        self.primaryColor = primaryColor
        self.splash = splash
    }
}

// MARK: Branding convenience initializers and mutators

public extension Branding {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Branding.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        backgroundColor: String? = nil,
        iconURL: String? = nil,
        primaryColor: String? = nil,
        splash: Splash?? = nil
    ) -> Branding {
        return Branding(
            backgroundColor: backgroundColor ?? self.backgroundColor,
            iconURL: iconURL ?? self.iconURL,
            primaryColor: primaryColor ?? self.primaryColor,
            splash: splash ?? self.splash
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - Splash
public struct Splash: Codable {
    public let backgroundColor: String
    public let imageURL: String?

    public enum CodingKeys: String, CodingKey {
        case backgroundColor
        case imageURL = "imageUrl"
    }

    public init(backgroundColor: String, imageURL: String?) {
        self.backgroundColor = backgroundColor
        self.imageURL = imageURL
    }
}

// MARK: Splash convenience initializers and mutators

public extension Splash {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Splash.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        backgroundColor: String? = nil,
        imageURL: String?? = nil
    ) -> Splash {
        return Splash(
            backgroundColor: backgroundColor ?? self.backgroundColor,
            imageURL: imageURL ?? self.imageURL
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - Capabilities
public struct Capabilities: Codable {
    public let camera: Camera
    public let files: Files
    public let location, microphone, notifications: Camera
    public let push: Push
    public let share: Camera

    public init(camera: Camera, files: Files, location: Camera, microphone: Camera, notifications: Camera, push: Push, share: Camera) {
        self.camera = camera
        self.files = files
        self.location = location
        self.microphone = microphone
        self.notifications = notifications
        self.push = push
        self.share = share
    }
}

// MARK: Capabilities convenience initializers and mutators

public extension Capabilities {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Capabilities.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        camera: Camera? = nil,
        files: Files? = nil,
        location: Camera? = nil,
        microphone: Camera? = nil,
        notifications: Camera? = nil,
        push: Push? = nil,
        share: Camera? = nil
    ) -> Capabilities {
        return Capabilities(
            camera: camera ?? self.camera,
            files: files ?? self.files,
            location: location ?? self.location,
            microphone: microphone ?? self.microphone,
            notifications: notifications ?? self.notifications,
            push: push ?? self.push,
            share: share ?? self.share
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - Camera
public struct Camera: Codable {
    public let enabled: Bool
    public let rationale: String?

    public init(enabled: Bool, rationale: String?) {
        self.enabled = enabled
        self.rationale = rationale
    }
}

// MARK: Camera convenience initializers and mutators

public extension Camera {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Camera.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        enabled: Bool? = nil,
        rationale: String?? = nil
    ) -> Camera {
        return Camera(
            enabled: enabled ?? self.enabled,
            rationale: rationale ?? self.rationale
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - Files
public struct Files: Codable {
    public let downloads: Bool?
    public let enabled: Bool
    public let rationale: String?
    public let uploads: Bool?

    public init(downloads: Bool?, enabled: Bool, rationale: String?, uploads: Bool?) {
        self.downloads = downloads
        self.enabled = enabled
        self.rationale = rationale
        self.uploads = uploads
    }
}

// MARK: Files convenience initializers and mutators

public extension Files {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Files.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        downloads: Bool?? = nil,
        enabled: Bool? = nil,
        rationale: String?? = nil,
        uploads: Bool?? = nil
    ) -> Files {
        return Files(
            downloads: downloads ?? self.downloads,
            enabled: enabled ?? self.enabled,
            rationale: rationale ?? self.rationale,
            uploads: uploads ?? self.uploads
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - Push
public struct Push: Codable {
    public let enabled: Bool
    public let rationale: String?
    public let tokenEndpoint: String?

    public init(enabled: Bool, rationale: String?, tokenEndpoint: String?) {
        self.enabled = enabled
        self.rationale = rationale
        self.tokenEndpoint = tokenEndpoint
    }
}

// MARK: Push convenience initializers and mutators

public extension Push {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Push.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        enabled: Bool? = nil,
        rationale: String?? = nil,
        tokenEndpoint: String?? = nil
    ) -> Push {
        return Push(
            enabled: enabled ?? self.enabled,
            rationale: rationale ?? self.rationale,
            tokenEndpoint: tokenEndpoint ?? self.tokenEndpoint
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - Compliance
public struct Compliance: Codable {
    public let accountDeletionURL: String?
    public let ageRating: AgeRating
    public let dataPractices: [DataPractice]
    public let privacyPolicyURL: String
    public let reviewerNotes: String?
    public let supportURL: String

    public enum CodingKeys: String, CodingKey {
        case accountDeletionURL = "accountDeletionUrl"
        case ageRating, dataPractices
        case privacyPolicyURL = "privacyPolicyUrl"
        case reviewerNotes
        case supportURL = "supportUrl"
    }

    public init(accountDeletionURL: String?, ageRating: AgeRating, dataPractices: [DataPractice], privacyPolicyURL: String, reviewerNotes: String?, supportURL: String) {
        self.accountDeletionURL = accountDeletionURL
        self.ageRating = ageRating
        self.dataPractices = dataPractices
        self.privacyPolicyURL = privacyPolicyURL
        self.reviewerNotes = reviewerNotes
        self.supportURL = supportURL
    }
}

// MARK: Compliance convenience initializers and mutators

public extension Compliance {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Compliance.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        accountDeletionURL: String?? = nil,
        ageRating: AgeRating? = nil,
        dataPractices: [DataPractice]? = nil,
        privacyPolicyURL: String? = nil,
        reviewerNotes: String?? = nil,
        supportURL: String? = nil
    ) -> Compliance {
        return Compliance(
            accountDeletionURL: accountDeletionURL ?? self.accountDeletionURL,
            ageRating: ageRating ?? self.ageRating,
            dataPractices: dataPractices ?? self.dataPractices,
            privacyPolicyURL: privacyPolicyURL ?? self.privacyPolicyURL,
            reviewerNotes: reviewerNotes ?? self.reviewerNotes,
            supportURL: supportURL ?? self.supportURL
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum AgeRating: String, Codable {
    case the12 = "12+"
    case the17 = "17+"
    case the4 = "4+"
    case the9 = "9+"
}

public enum DataPractice: String, Codable {
    case account = "account"
    case contact = "contact"
    case diagnostics = "diagnostics"
    case financial = "financial"
    case health = "health"
    case identifiers = "identifiers"
    case location = "location"
    case usage = "usage"
    case userContent = "user-content"
}

// MARK: - Identity
public struct Identity: Codable {
    public let buildNumber: Int
    public let displayName: String
    public let platformIdentifiers: PlatformIdentifiers
    public let slug: String
    public let version: String

    public init(buildNumber: Int, displayName: String, platformIdentifiers: PlatformIdentifiers, slug: String, version: String) {
        self.buildNumber = buildNumber
        self.displayName = displayName
        self.platformIdentifiers = platformIdentifiers
        self.slug = slug
        self.version = version
    }
}

// MARK: Identity convenience initializers and mutators

public extension Identity {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Identity.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        buildNumber: Int? = nil,
        displayName: String? = nil,
        platformIdentifiers: PlatformIdentifiers? = nil,
        slug: String? = nil,
        version: String? = nil
    ) -> Identity {
        return Identity(
            buildNumber: buildNumber ?? self.buildNumber,
            displayName: displayName ?? self.displayName,
            platformIdentifiers: platformIdentifiers ?? self.platformIdentifiers,
            slug: slug ?? self.slug,
            version: version ?? self.version
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - PlatformIdentifiers
public struct PlatformIdentifiers: Codable {
    public let android: String?
    public let ios: String?
    public let linux: String?
    public let macos: String?
    public let windows: String?

    public init(android: String?, ios: String?, linux: String?, macos: String?, windows: String?) {
        self.android = android
        self.ios = ios
        self.linux = linux
        self.macos = macos
        self.windows = windows
    }
}

// MARK: PlatformIdentifiers convenience initializers and mutators

public extension PlatformIdentifiers {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(PlatformIdentifiers.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        android: String?? = nil,
        ios: String?? = nil,
        linux: String?? = nil,
        macos: String?? = nil,
        windows: String?? = nil
    ) -> PlatformIdentifiers {
        return PlatformIdentifiers(
            android: android ?? self.android,
            ios: ios ?? self.ios,
            linux: linux ?? self.linux,
            macos: macos ?? self.macos,
            windows: windows ?? self.windows
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - Navigation
public struct Navigation: Codable {
    public let allowedOrigins: [String]
    public let externalLinks: ExternalLinks
    public let native: Native
    public let oauthOrigins: [String]

    public init(allowedOrigins: [String], externalLinks: ExternalLinks, native: Native, oauthOrigins: [String]) {
        self.allowedOrigins = allowedOrigins
        self.externalLinks = externalLinks
        self.native = native
        self.oauthOrigins = oauthOrigins
    }
}

// MARK: Navigation convenience initializers and mutators

public extension Navigation {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Navigation.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        allowedOrigins: [String]? = nil,
        externalLinks: ExternalLinks? = nil,
        native: Native? = nil,
        oauthOrigins: [String]? = nil
    ) -> Navigation {
        return Navigation(
            allowedOrigins: allowedOrigins ?? self.allowedOrigins,
            externalLinks: externalLinks ?? self.externalLinks,
            native: native ?? self.native,
            oauthOrigins: oauthOrigins ?? self.oauthOrigins
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum ExternalLinks: String, Codable {
    case block = "block"
    case system = "system"
}

// MARK: - Native
public struct Native: Codable {
    public let items: [AppSpecV]
    public let mode: Mode

    public init(items: [AppSpecV], mode: Mode) {
        self.items = items
        self.mode = mode
    }
}

// MARK: Native convenience initializers and mutators

public extension Native {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Native.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        items: [AppSpecV]? = nil,
        mode: Mode? = nil
    ) -> Native {
        return Native(
            items: items ?? self.items,
            mode: mode ?? self.mode
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - AppSpecV
public struct AppSpecV: Codable {
    public let icon: String?
    public let id: String
    public let label: String
    public let url: String

    public init(icon: String?, id: String, label: String, url: String) {
        self.icon = icon
        self.id = id
        self.label = label
        self.url = url
    }
}

// MARK: AppSpecV convenience initializers and mutators

public extension AppSpecV {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(AppSpecV.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        icon: String?? = nil,
        id: String? = nil,
        label: String? = nil,
        url: String? = nil
    ) -> AppSpecV {
        return AppSpecV(
            icon: icon ?? self.icon,
            id: id ?? self.id,
            label: label ?? self.label,
            url: url ?? self.url
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum Mode: String, Codable {
    case none = "none"
    case sidebar = "sidebar"
    case tabs = "tabs"
}

// MARK: - Ownership
public struct Ownership: Codable {
    public let verificationRecordIDS: [String]
    public let verifiedDomains: [String]

    public enum CodingKeys: String, CodingKey {
        case verificationRecordIDS = "verificationRecordIds"
        case verifiedDomains
    }

    public init(verificationRecordIDS: [String], verifiedDomains: [String]) {
        self.verificationRecordIDS = verificationRecordIDS
        self.verifiedDomains = verifiedDomains
    }
}

// MARK: Ownership convenience initializers and mutators

public extension Ownership {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Ownership.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        verificationRecordIDS: [String]? = nil,
        verifiedDomains: [String]? = nil
    ) -> Ownership {
        return Ownership(
            verificationRecordIDS: verificationRecordIDS ?? self.verificationRecordIDS,
            verifiedDomains: verifiedDomains ?? self.verifiedDomains
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - Release
public struct Release: Codable {
    public let channel: Channel
    public let updatePolicy: UpdatePolicy

    public init(channel: Channel, updatePolicy: UpdatePolicy) {
        self.channel = channel
        self.updatePolicy = updatePolicy
    }
}

// MARK: Release convenience initializers and mutators

public extension Release {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Release.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        channel: Channel? = nil,
        updatePolicy: UpdatePolicy? = nil
    ) -> Release {
        return Release(
            channel: channel ?? self.channel,
            updatePolicy: updatePolicy ?? self.updatePolicy
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum Channel: String, Codable {
    case beta = "beta"
    case channelInternal = "internal"
    case stable = "stable"
}

public enum UpdatePolicy: String, Codable {
    case manual = "manual"
    case signedFeed = "signed-feed"
    case store = "store"
}

public enum SchemaVersion: String, Codable {
    case the10 = "1.0"
}

// MARK: - Source
public struct Source: Codable {
    public let kind: Kind
    public let startURL: String?
    public let artifactSha256: String?

    public enum CodingKeys: String, CodingKey {
        case kind
        case startURL = "startUrl"
        case artifactSha256
    }

    public init(kind: Kind, startURL: String?, artifactSha256: String?) {
        self.kind = kind
        self.startURL = startURL
        self.artifactSha256 = artifactSha256
    }
}

// MARK: Source convenience initializers and mutators

public extension Source {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Source.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        kind: Kind? = nil,
        startURL: String?? = nil,
        artifactSha256: String?? = nil
    ) -> Source {
        return Source(
            kind: kind ?? self.kind,
            startURL: startURL ?? self.startURL,
            artifactSha256: artifactSha256 ?? self.artifactSha256
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum Kind: String, Codable {
    case kindStatic = "static"
    case url = "url"
}

// MARK: - Targets
public struct Targets: Codable {
    public let android: Android?
    public let ios: Ios?
    public let linux: Linux?
    public let macos: Macos?
    public let windows: Windows?

    public init(android: Android?, ios: Ios?, linux: Linux?, macos: Macos?, windows: Windows?) {
        self.android = android
        self.ios = ios
        self.linux = linux
        self.macos = macos
        self.windows = windows
    }
}

// MARK: Targets convenience initializers and mutators

public extension Targets {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Targets.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        android: Android?? = nil,
        ios: Ios?? = nil,
        linux: Linux?? = nil,
        macos: Macos?? = nil,
        windows: Windows?? = nil
    ) -> Targets {
        return Targets(
            android: android ?? self.android,
            ios: ios ?? self.ios,
            linux: linux ?? self.linux,
            macos: macos ?? self.macos,
            windows: windows ?? self.windows
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - Android
public struct Android: Codable {
    public let formats: [AndroidFormat]
    public let minSDK: Int
    public let signingReferenceID: String?
    public let targetAPI: Int

    public enum CodingKeys: String, CodingKey {
        case formats
        case minSDK = "minSdk"
        case signingReferenceID = "signingReferenceId"
        case targetAPI = "targetApi"
    }

    public init(formats: [AndroidFormat], minSDK: Int, signingReferenceID: String?, targetAPI: Int) {
        self.formats = formats
        self.minSDK = minSDK
        self.signingReferenceID = signingReferenceID
        self.targetAPI = targetAPI
    }
}

// MARK: Android convenience initializers and mutators

public extension Android {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Android.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        formats: [AndroidFormat]? = nil,
        minSDK: Int? = nil,
        signingReferenceID: String?? = nil,
        targetAPI: Int? = nil
    ) -> Android {
        return Android(
            formats: formats ?? self.formats,
            minSDK: minSDK ?? self.minSDK,
            signingReferenceID: signingReferenceID ?? self.signingReferenceID,
            targetAPI: targetAPI ?? self.targetAPI
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum AndroidFormat: String, Codable {
    case aab = "aab"
    case apk = "apk"
}

// MARK: - Ios
public struct Ios: Codable {
    public let formats: [IosFormat]
    public let minVersion: String
    public let signingReferenceID: String?

    public enum CodingKeys: String, CodingKey {
        case formats, minVersion
        case signingReferenceID = "signingReferenceId"
    }

    public init(formats: [IosFormat], minVersion: String, signingReferenceID: String?) {
        self.formats = formats
        self.minVersion = minVersion
        self.signingReferenceID = signingReferenceID
    }
}

// MARK: Ios convenience initializers and mutators

public extension Ios {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Ios.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        formats: [IosFormat]? = nil,
        minVersion: String? = nil,
        signingReferenceID: String?? = nil
    ) -> Ios {
        return Ios(
            formats: formats ?? self.formats,
            minVersion: minVersion ?? self.minVersion,
            signingReferenceID: signingReferenceID ?? self.signingReferenceID
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum IosFormat: String, Codable {
    case archive = "archive"
    case ipa = "ipa"
    case xcode = "xcode"
}

// MARK: - Linux
public struct Linux: Codable {
    public let architectures: [LinuxArchitecture]
    public let formats: [LinuxFormat]
    public let signingReferenceID: String?

    public enum CodingKeys: String, CodingKey {
        case architectures, formats
        case signingReferenceID = "signingReferenceId"
    }

    public init(architectures: [LinuxArchitecture], formats: [LinuxFormat], signingReferenceID: String?) {
        self.architectures = architectures
        self.formats = formats
        self.signingReferenceID = signingReferenceID
    }
}

// MARK: Linux convenience initializers and mutators

public extension Linux {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Linux.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        architectures: [LinuxArchitecture]? = nil,
        formats: [LinuxFormat]? = nil,
        signingReferenceID: String?? = nil
    ) -> Linux {
        return Linux(
            architectures: architectures ?? self.architectures,
            formats: formats ?? self.formats,
            signingReferenceID: signingReferenceID ?? self.signingReferenceID
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum LinuxArchitecture: String, Codable {
    case arm64 = "arm64"
    case x64 = "x64"
}

public enum LinuxFormat: String, Codable {
    case appimage = "appimage"
    case deb = "deb"
}

// MARK: - Macos
public struct Macos: Codable {
    public let architectures: [MacosArchitecture]
    public let formats: [MacosFormat]
    public let minVersion: String
    public let signingReferenceID: String?

    public enum CodingKeys: String, CodingKey {
        case architectures, formats, minVersion
        case signingReferenceID = "signingReferenceId"
    }

    public init(architectures: [MacosArchitecture], formats: [MacosFormat], minVersion: String, signingReferenceID: String?) {
        self.architectures = architectures
        self.formats = formats
        self.minVersion = minVersion
        self.signingReferenceID = signingReferenceID
    }
}

// MARK: Macos convenience initializers and mutators

public extension Macos {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Macos.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        architectures: [MacosArchitecture]? = nil,
        formats: [MacosFormat]? = nil,
        minVersion: String? = nil,
        signingReferenceID: String?? = nil
    ) -> Macos {
        return Macos(
            architectures: architectures ?? self.architectures,
            formats: formats ?? self.formats,
            minVersion: minVersion ?? self.minVersion,
            signingReferenceID: signingReferenceID ?? self.signingReferenceID
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum MacosArchitecture: String, Codable {
    case arm64 = "arm64"
    case universal = "universal"
    case x64 = "x64"
}

public enum MacosFormat: String, Codable {
    case app = "app"
    case dmg = "dmg"
}

// MARK: - Windows
public struct Windows: Codable {
    public let architectures: [LinuxArchitecture]
    public let formats: [WindowsFormat]
    public let minVersion: String
    public let signingReferenceID: String?

    public enum CodingKeys: String, CodingKey {
        case architectures, formats, minVersion
        case signingReferenceID = "signingReferenceId"
    }

    public init(architectures: [LinuxArchitecture], formats: [WindowsFormat], minVersion: String, signingReferenceID: String?) {
        self.architectures = architectures
        self.formats = formats
        self.minVersion = minVersion
        self.signingReferenceID = signingReferenceID
    }
}

// MARK: Windows convenience initializers and mutators

public extension Windows {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Windows.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        architectures: [LinuxArchitecture]? = nil,
        formats: [WindowsFormat]? = nil,
        minVersion: String? = nil,
        signingReferenceID: String?? = nil
    ) -> Windows {
        return Windows(
            architectures: architectures ?? self.architectures,
            formats: formats ?? self.formats,
            minVersion: minVersion ?? self.minVersion,
            signingReferenceID: signingReferenceID ?? self.signingReferenceID
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum WindowsFormat: String, Codable {
    case msix = "msix"
    case nsis = "nsis"
}

// MARK: - Helper functions for creating encoders and decoders

func newJSONDecoder() -> JSONDecoder {
    let decoder = JSONDecoder()
    if #available(iOS 10.0, OSX 10.12, tvOS 10.0, watchOS 3.0, *) {
        decoder.dateDecodingStrategy = .iso8601
    }
    return decoder
}

func newJSONEncoder() -> JSONEncoder {
    let encoder = JSONEncoder()
    if #available(iOS 10.0, OSX 10.12, tvOS 10.0, watchOS 3.0, *) {
        encoder.dateEncodingStrategy = .iso8601
    }
    return encoder
}
