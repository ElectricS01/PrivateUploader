"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("ChatEmojis", "userId", {
      type: Sequelize.BIGINT,
      allowNull: true
    })
    await queryInterface.removeConstraint("ChatEmojis", "chatemojis_ibfk_2")
  }
}
