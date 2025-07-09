import * as XLSX from 'xlsx';

// Type definitions
interface ImportMemberData {
  full_name: string;
  job_title?: string;
  role: string;
  permissions: {
    read: boolean;
    write: boolean;
    admin: boolean;
  };
  email: string;
}

interface ImportTemplateData {
  name: string;
  description?: string;
  role: string;
  permissions: {
    read: boolean;
    write: boolean;
    admin: boolean;
  };
  is_default: boolean;
}

interface ImportResult<T> {
  success: boolean;
  data?: T[];
  errors: string[];
  warnings: string[];
}

interface ImportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const importUtils = {
  // Parse CSV file to array of objects
  parseCSV(csvContent: string): any[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }
    
    return data;
  },

  // Parse Excel file to array of objects
  parseExcel(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  },

  // Import members from CSV/Excel data
  async importMembers(data: any[]): Promise<ImportResult<ImportMemberData>> {
    const result: ImportResult<ImportMemberData> = {
      success: false,
      data: [],
      errors: [],
      warnings: []
    };

    if (!data.length) {
      result.errors.push('No data found in file');
      return result;
    }

    const validMembers: ImportMemberData[] = [];
    
    data.forEach((row, index) => {
      const validation = this.validateMemberRow(row, index + 1);
      
      if (validation.isValid) {
        validMembers.push({
          full_name: row['Full Name'] || row['full_name'] || '',
          job_title: row['Job Title'] || row['job_title'] || '',
          email: row['Email'] || row['email'] || '',
          role: this.normalizeRole(row['Role'] || row['role'] || 'member'),
          permissions: {
            read: this.parseBooleanValue(row['Read Access'] || row['read_access'] || 'Yes'),
            write: this.parseBooleanValue(row['Write Access'] || row['write_access'] || 'No'),
            admin: this.parseBooleanValue(row['Admin Access'] || row['admin_access'] || 'No'),
          }
        });
      }
      
      result.errors.push(...validation.errors);
      result.warnings.push(...validation.warnings);
    });

    result.data = validMembers;
    result.success = validMembers.length > 0;
    
    return result;
  },

  // Import permission templates from JSON
  async importTemplates(jsonContent: string): Promise<ImportResult<ImportTemplateData>> {
    const result: ImportResult<ImportTemplateData> = {
      success: false,
      data: [],
      errors: [],
      warnings: []
    };

    try {
      const importData = JSON.parse(jsonContent);
      
      if (!importData.templates || !Array.isArray(importData.templates)) {
        result.errors.push('Invalid JSON format: templates array not found');
        return result;
      }

      const validTemplates: ImportTemplateData[] = [];
      
      importData.templates.forEach((template: any, index: number) => {
        const validation = this.validateTemplateData(template, index + 1);
        
        if (validation.isValid) {
          validTemplates.push({
            name: template.name,
            description: template.description,
            role: this.normalizeRole(template.role),
            permissions: {
              read: Boolean(template.permissions?.read ?? true),
              write: Boolean(template.permissions?.write ?? false),
              admin: Boolean(template.permissions?.admin ?? false),
            },
            is_default: Boolean(template.is_default ?? false),
          });
        }
        
        result.errors.push(...validation.errors);
        result.warnings.push(...validation.warnings);
      });

      result.data = validTemplates;
      result.success = validTemplates.length > 0;
      
    } catch (error) {
      result.errors.push('Invalid JSON format: ' + (error as Error).message);
    }

    return result;
  },

  // Validation functions
  validateMemberRow(row: any, rowNumber: number): ImportValidationResult {
    const result: ImportValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check required fields
    if (!row['Full Name'] && !row['full_name']) {
      result.errors.push(`Row ${rowNumber}: Full Name is required`);
      result.isValid = false;
    }

    if (!row['Email'] && !row['email']) {
      result.errors.push(`Row ${rowNumber}: Email is required`);
      result.isValid = false;
    }

    // Validate email format
    const email = row['Email'] || row['email'];
    if (email && !this.isValidEmail(email)) {
      result.errors.push(`Row ${rowNumber}: Invalid email format`);
      result.isValid = false;
    }

    // Validate role
    const role = row['Role'] || row['role'];
    if (role && !this.isValidRole(role)) {
      result.warnings.push(`Row ${rowNumber}: Invalid role '${role}', will default to 'member'`);
    }

    return result;
  },

  validateTemplateData(template: any, index: number): ImportValidationResult {
    const result: ImportValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check required fields
    if (!template.name) {
      result.errors.push(`Template ${index}: Name is required`);
      result.isValid = false;
    }

    if (!template.role) {
      result.errors.push(`Template ${index}: Role is required`);
      result.isValid = false;
    }

    // Validate role
    if (template.role && !this.isValidRole(template.role)) {
      result.warnings.push(`Template ${index}: Invalid role '${template.role}', will normalize to valid role`);
    }

    // Validate permissions structure
    if (!template.permissions || typeof template.permissions !== 'object') {
      result.errors.push(`Template ${index}: Permissions object is required`);
      result.isValid = false;
    }

    return result;
  },

  // Helper functions
  parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result.map(value => value.replace(/^"|"$/g, ''));
  },

  parseBooleanValue(value: string): boolean {
    if (typeof value === 'boolean') return value;
    const str = value.toString().toLowerCase().trim();
    return str === 'yes' || str === 'true' || str === '1' || str === 'on';
  },

  normalizeRole(role: string): string {
    const normalized = role.toLowerCase().trim();
    switch (normalized) {
      case 'owner':
      case 'admin':
        return 'owner';
      case 'manager':
      case 'lead':
        return 'manager';
      case 'member':
      case 'user':
        return 'member';
      case 'viewer':
      case 'guest':
        return 'viewer';
      default:
        return 'member';
    }
  },

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidRole(role: string): boolean {
    const validRoles = ['owner', 'manager', 'member', 'viewer', 'admin', 'lead', 'user', 'guest'];
    return validRoles.includes(role.toLowerCase().trim());
  },

  // Generate import template
  generateMemberImportTemplate(): string {
    const template = [
      'Full Name,Job Title,Email,Role,Read Access,Write Access,Admin Access',
      'John Doe,Project Manager,john@example.com,manager,Yes,Yes,No',
      'Jane Smith,Developer,jane@example.com,member,Yes,Yes,No',
      'Bob Johnson,Designer,bob@example.com,member,Yes,No,No',
      'Alice Brown,Viewer,alice@example.com,viewer,Yes,No,No',
    ].join('\n');
    
    return template;
  },

  generateTemplateImportTemplate(): string {
    const template = {
      export_info: {
        company_name: "Your Company",
        export_date: new Date().toISOString(),
        total_templates: 2,
        version: "1.0"
      },
      templates: [
        {
          name: "Standard Manager",
          description: "Standard permissions for project managers",
          role: "manager",
          permissions: {
            read: true,
            write: true,
            admin: false
          },
          is_default: true
        },
        {
          name: "Read-Only Access",
          description: "Read-only access for stakeholders",
          role: "viewer",
          permissions: {
            read: true,
            write: false,
            admin: false
          },
          is_default: false
        }
      ]
    };
    
    return JSON.stringify(template, null, 2);
  },
};