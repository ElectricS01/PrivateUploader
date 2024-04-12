"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("OauthUsers", "manage", {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    })
  }
}
