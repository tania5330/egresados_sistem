import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportTypeSelector } from '../ReportTypeSelector';

describe('ReportTypeSelector', () => {
  const mockReportTypes = [
    {
      id: 'egresados',
      name: 'Reporte de Egresados',
      description: 'Estadísticas y información de egresados',
    },
    {
      id: 'ofertas',
      name: 'Reporte de Ofertas',
      description: 'Análisis de ofertas laborales',
    },
    {
      id: 'empresas',
      name: 'Reporte de Empresas',
      description: 'Reporte de empresas registradas',
    },
    {
      id: 'postulaciones',
      name: 'Reporte de Postulaciones',
      description: 'Seguimiento de postulaciones',
    },
  ];

  describe('renders all report types', () => {
    it('should render all report type options', () => {
      render(
        <ReportTypeSelector
          reportTypes={mockReportTypes}
          selectedType={null}
          onSelect={() => {}}
        />
      );

      expect(screen.getByText('Reporte de Egresados')).toBeInTheDocument();
      expect(screen.getByText('Reporte de Ofertas')).toBeInTheDocument();
      expect(screen.getByText('Reporte de Empresas')).toBeInTheDocument();
      expect(screen.getByText('Reporte de Postulaciones')).toBeInTheDocument();
    });

    it('should render correct descriptions for each report type', () => {
      render(
        <ReportTypeSelector
          reportTypes={mockReportTypes}
          selectedType={null}
          onSelect={() => {}}
        />
      );

      expect(screen.getByText('Estadísticas y información de egresados')).toBeInTheDocument();
      expect(screen.getByText('Análisis de ofertas laborales')).toBeInTheDocument();
      expect(screen.getByText('Reporte de empresas registradas')).toBeInTheDocument();
      expect(screen.getByText('Seguimiento de postulaciones')).toBeInTheDocument();
    });

    it('should render title for selection section', () => {
      render(
        <ReportTypeSelector
          reportTypes={mockReportTypes}
          selectedType={null}
          onSelect={() => {}}
        />
      );

      expect(screen.getByText('Seleccionar Tipo de Reporte')).toBeInTheDocument();
    });

    it('should render all buttons for report types', () => {
      render(
        <ReportTypeSelector
          reportTypes={mockReportTypes}
          selectedType={null}
          onSelect={() => {}}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(mockReportTypes.length);
    });
  });

  describe('selection callback', () => {
    it('should call onSelect with correct typeId when clicked', () => {
      const handleSelect = vi.fn();

      render(
        <ReportTypeSelector
          reportTypes={mockReportTypes}
          selectedType={null}
          onSelect={handleSelect}
        />
      );

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[0]);

      expect(handleSelect).toHaveBeenCalledWith('egresados');
    });

    it('should call onSelect when second option is clicked', () => {
      const handleSelect = vi.fn();

      render(
        <ReportTypeSelector
          reportTypes={mockReportTypes}
          selectedType={null}
          onSelect={handleSelect}
        />
      );

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[1]);

      expect(handleSelect).toHaveBeenCalledWith('ofertas');
    });

    it('should highlight selected report type', () => {
      const { container } = render(
        <ReportTypeSelector
          reportTypes={mockReportTypes}
          selectedType="ofertas"
          onSelect={() => {}}
        />
      );

      const selectedButton = container.querySelector('.ring-2');
      expect(selectedButton).toBeInTheDocument();
    });

    it('should not highlight unselected report types', () => {
      const { container } = render(
        <ReportTypeSelector
          reportTypes={mockReportTypes}
          selectedType="ofertas"
          onSelect={() => {}}
        />
      );

      const rings = container.querySelectorAll('.ring-2');
      expect(rings.length).toBe(1);
    });

    it('should allow changing selection', () => {
      const handleSelect = vi.fn();

      const { rerender } = render(
        <ReportTypeSelector
          reportTypes={mockReportTypes}
          selectedType="egresados"
          onSelect={handleSelect}
        />
      );

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[1]);

      expect(handleSelect).toHaveBeenCalledWith('ofertas');
    });
  });

  describe('loading state', () => {
    it('should render loading state when isLoading is true', () => {
      render(
        <ReportTypeSelector
          reportTypes={mockReportTypes}
          selectedType={null}
          onSelect={() => {}}
          isLoading={true}
        />
      );

      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(4);
    });

    it('should not render report type buttons when loading', () => {
      render(
        <ReportTypeSelector
          reportTypes={mockReportTypes}
          selectedType={null}
          onSelect={() => {}}
          isLoading={true}
        />
      );

      expect(screen.queryByText('Reporte de Egresados')).not.toBeInTheDocument();
    });
  });
});