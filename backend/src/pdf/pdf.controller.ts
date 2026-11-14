import { Controller, Get, Param, Query, ParseIntPipe, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PdfService } from './pdf.service';

@Controller('pdf')
export class PdfController {
    constructor(private readonly pdfService: PdfService) { }

    @Get('livret/:eleveId')
    async generateLivret(
        @Param('eleveId', ParseIntPipe) eleveId: number,
        @Query('acquisSeulement') acquisSeulement: string,
        @Res() res: Response,
    ) {
        const acquis = acquisSeulement !== 'false';
        const buffer = await this.pdfService.generateLivretPdf(eleveId, acquis);
        this.sendPdf(res, buffer, `livret_eleve_${eleveId}.pdf`);
    }

    @Get('classe')
    async generateClasse(
        @Query('acquisSeulement') acquisSeulement: string,
        @Query('classe') classe: string | undefined,
        @Res() res: Response,
    ) {
        const acquis = acquisSeulement === 'true';
        const buffer = await this.pdfService.generateClassePdf(acquis, classe);
        const suffix = classe ? `_${classe.replace(/\s+/g, '_')}` : '';
        this.sendPdf(res, buffer, `livrets_classe${suffix}.pdf`);
    }

    @Get('seance/:seanceId')
    async generateSeance(
        @Param('seanceId', ParseIntPipe) seanceId: number,
        @Res() res: Response,
    ) {
        const buffer = await this.pdfService.generateSeancePdf(seanceId);
        this.sendPdf(res, buffer, `fiche_seance_${seanceId}.pdf`);
    }

    private sendPdf(res: Response, buffer: Buffer, filename: string) {
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }
}
