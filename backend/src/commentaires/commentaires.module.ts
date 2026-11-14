import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Commentaire } from '../entities/commentaire.entity';
import { CommentairesService } from './commentaires.service';
import { CommentairesController } from './commentaires.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Commentaire])],
    providers: [CommentairesService],
    controllers: [CommentairesController],
    exports: [CommentairesService],
})
export class CommentairesModule { }
