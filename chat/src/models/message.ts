import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { Conversation } from './conversation';

interface MessageAttributes {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  contentType: 'text' | 'image' | 'file';
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MessageCreationAttributes extends Optional<MessageAttributes, 'id' | 'isRead' | 'createdAt' | 'updatedAt'> {}

class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  public id!: string;
  public conversationId!: string;
  public senderId!: string;
  public content!: string;
  public contentType!: 'text' | 'image' | 'file';
  public isRead!: boolean;
  public createdAt?: Date;
  public updatedAt?: Date;

  static initModel(sequelize: Sequelize): void {
    Message.init(
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
        senderId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        contentType: {
          type: DataTypes.ENUM('text', 'image', 'file'),
          defaultValue: 'text',
          allowNull: false,
        },
        isRead: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
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
        tableName: 'Messages',
        timestamps: true,
      }
    );
  }

  static associate(models: { [key: string]: any }): void {
    Message.belongsTo(models.Conversation, { foreignKey: 'conversationId' });
  }
}


export { Message };