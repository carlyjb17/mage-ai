export enum ExecutionStateEnum {
  BUSY = 'busy', // Code is being executed
  IDLE = 'idle', // Nothing is being done
  QUEUED = 'queued', // Block is being attempted to run but another block is still busy
}

export enum DataTypeEnum {
  IMAGE_PNG = 'image/png',
  TABLE = 'table',
  TEXT = 'text',
  TEXT_PLAIN = 'text/plain',
}

export const DATA_TYPE_TEXTLIKE = [
  DataTypeEnum.TEXT,
  DataTypeEnum.TEXT_PLAIN,
];

export enum MsgType {
  STATUS = 'status',
  STREAM = 'stream',
}

export default interface KernelOutputType {
  data?: string | string[];
  error?: string;
  execution_state: ExecutionStateEnum;
  metadata?: {
    [key: string]: string;
  };
  msg_id: string;
  msg_type: MsgType;
  type: DataTypeEnum;
  uuid: string;
}
