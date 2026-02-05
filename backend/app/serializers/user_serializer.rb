class UserSerializer
  def self.serialize(user)
    {
      id: user.id,
      nickname: user.nickname,
      admin: user.admin
    }
  end
end
