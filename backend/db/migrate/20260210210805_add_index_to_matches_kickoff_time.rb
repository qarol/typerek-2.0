class AddIndexToMatchesKickoffTime < ActiveRecord::Migration[8.1]
  def change
    add_index :matches, :kickoff_time
  end
end
