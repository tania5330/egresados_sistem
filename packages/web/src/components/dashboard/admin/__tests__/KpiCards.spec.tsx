import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KpiCards } from '../KpiCards';

describe('KpiCards', () => {
  const mockKpiData = {
    total_egresados: 150,
    total_empresas: 25,
    ofertas_activas: 42,
    tasa_empleabilidad: 67.5,
  };

  describe('renders all 4 KPI cards', () => {
    it('should render all 4 KPI cards when data is provided', () => {
      render(<KpiCards data={mockKpiData} />);

      expect(screen.getByText('Total Egresados')).toBeInTheDocument();
      expect(screen.getByText('Empresas Registradas')).toBeInTheDocument();
      expect(screen.getByText('Ofertas Activas')).toBeInTheDocument();
      expect(screen.getByText('Tasa de Empleabilidad')).toBeInTheDocument();
    });

    it('should display correct values for each card', () => {
      render(<KpiCards data={mockKpiData} />);

      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('67.5%')).toBeInTheDocument();
    });

    it('should render correct descriptions for each card', () => {
      render(<KpiCards data={mockKpiData} />);

      expect(screen.getByText('Usuarios registrados en el sistema')).toBeInTheDocument();
      expect(screen.getByText('Empresas con ofertas activas')).toBeInTheDocument();
      expect(screen.getByText('Ofertas laborales disponibles')).toBeInTheDocument();
      expect(screen.getByText('Porcentaje de egresados contratados')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should render loading state when isLoading is true', () => {
      render(<KpiCards isLoading={true} />);

      const cards = document.querySelectorAll('.animate-pulse');
      expect(cards.length).toBe(4);
    });

    it('should not display values when loading', () => {
      render(<KpiCards isLoading={true} />);

      expect(screen.queryByText('150')).not.toBeInTheDocument();
      expect(screen.queryByText('25')).not.toBeInTheDocument();
      expect(screen.queryByText('42')).not.toBeInTheDocument();
      expect(screen.queryByText('67.5%')).not.toBeInTheDocument();
    });

    it('should display skeleton placeholders while loading', () => {
      render(<KpiCards isLoading={true} />);

      const skeletons = document.querySelectorAll('.bg-muted');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('data display', () => {
    it('should display zero values when data contains zeros', () => {
      const zeroData = {
        total_egresados: 0,
        total_empresas: 0,
        ofertas_activas: 0,
        tasa_empleabilidad: 0,
      };

      render(<KpiCards data={zeroData} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should display default values when data is undefined', () => {
      render(<KpiCards />);

      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should display large numbers correctly', () => {
      const largeData = {
        total_egresados: 10000,
        total_empresas: 5000,
        ofertas_activas: 1500,
        tasa_empleabilidad: 85.5,
      };

      render(<KpiCards data={largeData} />);

      expect(screen.getByText('10000')).toBeInTheDocument();
      expect(screen.getByText('5000')).toBeInTheDocument();
      expect(screen.getByText('1500')).toBeInTheDocument();
      expect(screen.getByText('85.5%')).toBeInTheDocument();
    });

    it('should have proper grid layout with 4 columns on large screens', () => {
      render(<KpiCards data={mockKpiData} />);

      const grid = document.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid?.className).toContain('lg:grid-cols-4');
    });
  });
});