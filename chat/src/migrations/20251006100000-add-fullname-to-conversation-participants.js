'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Thêm cột 'fullName' vào bảng 'ConversationParticipants'
    await queryInterface.addColumn('ConversationParticipants', 'fullName', {
      type: Sequelize.STRING(255), // Đặt độ dài phù hợp
      allowNull: true, // hoặc false nếu bạn chắc chắn luôn có tên
      defaultValue: null, // hoặc một giá trị mặc định nếu cần
    });
  },

  async down (queryInterface, Sequelize) {
    // Xóa cột 'fullName' khỏi bảng 'ConversationParticipants'
    await queryInterface.removeColumn('ConversationParticipants', 'fullName');
  }
};