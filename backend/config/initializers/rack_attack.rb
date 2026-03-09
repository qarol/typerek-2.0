class Rack::Attack
  # Throttle login attempts by IP
  throttle("sessions/ip", limit: 5, period: 60.seconds) do |req|
    req.ip if req.post? && req.path == "/api/v1/sessions"
  end

  # Throttle token verification by IP (invite link brute-force)
  throttle("verify_token/ip", limit: 10, period: 60.seconds) do |req|
    req.ip if req.get? && req.path == "/api/v1/users/verify_token"
  end

  # Throttle account activation by IP
  throttle("activate/ip", limit: 5, period: 60.seconds) do |req|
    req.ip if req.post? && req.path == "/api/v1/users/activate"
  end

  # Return 429 with JSON error body
  self.throttled_responder = lambda do |env|
    [
      429,
      { "Content-Type" => "application/json" },
      [ { error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later.", field: nil } }.to_json ]
    ]
  end
end
