import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

import { Link } from './link.entity';
import { Offer } from './offer.entity';

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', nullable: true })
  title: string | null = null;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string | null = null;

  @Column({ name: 'source', type: 'text', default: 'admin' })
  source!: string;

  @Column({ name: 'normalized_sku', type: 'text', nullable: true })
  normalizedSku: string | null = null;

  @Column({ name: 'normalized_url', type: 'text', nullable: true })
  normalizedUrl: string | null = null;

  @Column({ name: 'raw_input', type: 'jsonb', nullable: true })
  rawInput: Record<string, unknown> | null = null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => Offer, (offer) => offer.product, { cascade: true })
  offers?: Offer[];

  @OneToMany(() => Link, (link) => link.product)
  links?: Link[];
}
