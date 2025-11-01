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

import { Product } from './product.entity';

@Entity({ name: 'offers' })
@Index(['productId', 'marketplace'], { unique: false })
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, (product) => product.offers, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'text' })
  marketplace!: string;

  @Column({ name: 'store_name', type: 'text' })
  storeName!: string;

  @Column({ type: 'numeric' })
  price!: number;

  @Column({ type: 'text', default: 'THB' })
  currency!: string;

  @Column({ name: 'last_checked_at', type: 'timestamptz' })
  lastCheckedAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
