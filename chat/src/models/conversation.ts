import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { Message } from './message'; // Import Message model
import { ConversationParticipant } from './conversation-participant'; // Import ConversationParticipant model

interface ConversationAttributes {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ConversationCreationAttributes extends Optional<ConversationAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Conversation extends Model<ConversationAttributes, ConversationCreationAttributes> implements ConversationAttributes {
  public id!: string;
  public createdAt?: Date;
  public updatedAt?: Date;

  static initModel(sequelize: Sequelize): void {
    Conversation.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
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
        tableName: 'Conversations',
        timestamps: true,
      }
    );
  }

  static associate(models: { [key: string]: any }): void {
    Conversation.hasMany(models.Message, {
      as: 'messages',
      foreignKey: 'conversationId',
    });
    Conversation.hasMany(models.ConversationParticipant, {
      as: 'participants',
      foreignKey: 'conversationId',
    });
  }
}

export { Conversation };