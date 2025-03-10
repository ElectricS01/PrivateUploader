"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("OauthUsers", "createdAt", {
      type: Sequelize.DATE,
      allowNull: false
    })

    await queryInterface.addColumn("OauthUsers", "updatedAt", {
      type: Sequelize.DATE,
      allowNull: false
    })
  }
}
