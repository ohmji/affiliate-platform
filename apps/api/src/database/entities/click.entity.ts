import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';

import { Link } from './link.entity';

@Entity({ name: 'clicks' })
@Index(['linkId', 'occurredAt'])
export class Click {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: number;

  @Column({ name: 'link_id', type: 'uuid' })
  linkId!: string;

  @ManyToOne(() => Link, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'link_id' })
  link!: Link;

  @Column({ name: 'occurred_at', type: 'timestamptz', default: () => 'now()' })
  occurredAt!: Date;

  @Column({ type: 'text', nullable: true })
  referrer: string | null = null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null = null;

  @Column({ name: 'ip_hash', type: 'text', nullable: true })
  ipHash: string | null = null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
