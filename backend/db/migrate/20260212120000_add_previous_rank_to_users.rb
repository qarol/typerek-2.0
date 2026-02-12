class AddPreviousRankToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :previous_rank, :integer
  end
end
