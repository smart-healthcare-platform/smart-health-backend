import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { Conversation } from './conversation';

interface ConversationParticipantAttributes {
  id: string;
  conversationId: string;
  userId: string;
  role: 'doctor' | 'patient';
  createdAt?: Date;
  updatedAt?: Date;
}

interface ConversationParticipantCreationAttributes extends Optional<ConversationParticipantAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class ConversationParticipant extends Model<ConversationParticipantAttributes, ConversationParticipantCreationAttributes> implements ConversationParticipantAttributes {
  public id!: string;
  public conversationId!: string;
  public userId!: string;
  public role!: 'doctor' | 'patient';
  public createdAt?: Date;
  public updatedAt?: Date;

  static initModel(sequelize: Sequelize): void {
    ConversationParticipant.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        conversationId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'Conversations',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        userId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        role: {
          type: DataTypes.ENUM('doctor', 'patient'),
          allowNull: false,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: 'ConversationParticipants',
        timestamps: true,
      }
    );
  }

  static associate(models: { [key: string]: any }): void {
    ConversationParticipant.belongsTo(models.Conversation, { foreignKey: 'conversationId' });
  }
}


export { ConversationParticipant };