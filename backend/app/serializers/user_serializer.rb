class UserSerializer
  def self.serialize(user)
    {
      id: user.id,
      nickname: user.nickname,
      admin: user.admin
    }
  end

  def self.serialize_for_admin(user)
    {
      id: user.id,
      nickname: user.nickname,
      admin: user.admin,
      activated: user.activated
    }.transform_keys { |key| key.to_s.camelize(:lower) }
  end
end
