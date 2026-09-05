import Foundation

struct OriginPolicy {
    let allowedOrigins: Set<String>

    init(origins: [String], verifiedDomains: Set<String>) throws {
        guard !origins.isEmpty, origins.allSatisfy({ value in
            guard let url = URL(string: value), let host = url.host else { return false }
            return Self.origin(url) == value && verifiedDomains.contains(host)
        }) else { throw URLError(.unsupportedURL) }
        allowedOrigins = Set(origins)
    }

    func allows(_ url: URL) -> Bool {
        guard let origin = Self.origin(url) else { return false }
        return allowedOrigins.contains(origin)
    }

    static func origin(_ url: URL) -> String? {
        guard url.scheme == "https", url.user == nil, url.password == nil,
              let host = url.host, host == host.lowercased(),
              url.port == nil || url.port == 443 else { return nil }
        return "https://" + host
    }
}
