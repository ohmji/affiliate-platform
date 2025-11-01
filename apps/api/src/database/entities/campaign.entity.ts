import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

import { Link } from './link.entity';

@Entity({ name: 'campaigns' })
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ name: 'utm_campaign', type: 'text', nullable: true })
  utmCampaign: string | null = null;

  @Column({ name: 'start_at', type: 'timestamptz', nullable: true })
  startAt: Date | null = null;

  @Column({ name: 'end_at', type: 'timestamptz', nullable: true })
  endAt: Date | null = null;

  @Column({
    type: 'text',
    default: 'draft'
  })
  status!: 'draft' | 'published';

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => Link, (link) => link.campaign)
  links?: Link[];
}
