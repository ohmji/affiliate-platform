import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

import { Campaign } from './campaign.entity';
import { Product } from './product.entity';

@Entity({ name: 'links' })
@Index(['shortCode'], { unique: true })
export class Link {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, (product) => product.links, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ name: 'campaign_id', type: 'uuid', nullable: true })
  campaignId: string | null = null;

  @ManyToOne(() => Campaign, (campaign) => campaign.links, {
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'campaign_id' })
  campaign?: Campaign | null;

  @Column({ name: 'short_code', type: 'text' })
  shortCode!: string;

  @Column({ type: 'text' })
  marketplace!: string;

  @Column({ name: 'target_url', type: 'text' })
  targetUrl!: string;

  @Column({ name: 'utm_source', type: 'text', nullable: true })
  utmSource: string | null = null;

  @Column({ name: 'utm_medium', type: 'text', nullable: true })
  utmMedium: string | null = null;

  @Column({ name: 'utm_campaign', type: 'text', nullable: true })
  utmCampaign: string | null = null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
