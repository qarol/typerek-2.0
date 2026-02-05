class AddLowerNicknameIndexToUsers < ActiveRecord::Migration[8.1]
  def change
    # Add functional index for case-insensitive nickname lookups
    add_index :users, 'LOWER(nickname)', unique: true, name: 'index_users_on_lower_nickname'
  end
end
