export interface ModuleDef {
  name: string;
  baseToken: string;
  prefix: string;
  icon: string;
  path?: string;
}

export interface ModuleGroups {
  CORE: {
    title: string;
    modules: ModuleDef[];
  };
  MODULES: {
    title: string;
    modules: ModuleDef[];
  };
}

export const MODULE_GROUPS: ModuleGroups = {
  CORE: {
    title: 'CORE SETUP MODULES',
    modules: [
      { name: 'User Management', baseToken: 'USERS', prefix: 'USER_MANAGEMENT', icon: '👥', path: '/users' },
      { name: 'Department', baseToken: 'DEPARTMENTS', prefix: 'DEPARTMENT', icon: '🏢', path: '/department' },
      { name: 'Role & Permissions', baseToken: 'ROLES', prefix: 'ROLES', icon: '🛡️', path: '/roles' },
      { name: 'Farm Management', baseToken: 'FARMS', prefix: 'FARM_MANAGEMENT', icon: '🏠', path: '/farms' },
      { name: 'Land Management', baseToken: 'LAND', prefix: 'LAND_MANAGEMENT', icon: '🗺️', path: '/land-management' },
      { name: 'BMC Management', baseToken: 'BMC', prefix: 'BMC', icon: '❄️', path: '/bmc-management' },
      { name: 'Shed Management', baseToken: 'SHEDS', prefix: 'SHED_MANAGEMENT', icon: '⚙️', path: '/shed-management' },
      { name: 'Line Management', baseToken: 'SHEDS', prefix: 'SHED_MANAGEMENT', icon: '📏', path: '/line-management' },
      { name: 'Cattle Management', baseToken: 'CATTLE', prefix: 'CATTLE_MANAGEMENT', icon: '🐄', path: '/cattle-management' },
      { name: 'Health Management', baseToken: 'HEALTH', prefix: 'HEALTH_MANAGEMENT', icon: '🩺', path: '/health-management' },
      { name: 'Feed Items', baseToken: 'INVENTORY', prefix: 'FEED_ITEMS', icon: '🌾', path: '/feed-items' },
      { name: 'Tag Management', baseToken: 'CATTLE', prefix: 'TAG_MANAGEMENT', icon: '🏷️', path: '/tag-management' },
      { name: 'Breed Management', baseToken: 'CATTLE', prefix: 'BREED_MANAGEMENT', icon: '🧬', path: '/breed-management' },
      { name: 'Animal Management', baseToken: 'CATTLE', prefix: 'ANIMAL_MANAGEMENT', icon: '🐏', path: '/animal-management' },
      { name: 'Insemination Management', baseToken: 'CROSSING_LOG', prefix: 'INSEMINATION_MANAGEMENT', icon: '🧬', path: '/insemination' },
      { name: 'Procurement Management', baseToken: 'PROCUREMENT_MANAGEMENT', prefix: 'PROCUREMENT_MANAGEMENT', icon: '🛒', path: '/procurement-management' }
    ]
  },
  MODULES: {
    title: 'OPERATIONAL LOGS & INVENTORY',
    modules: [
      { name: 'Live Stock', baseToken: 'CATTLE', prefix: 'LIVESTOCK', icon: '🐄', path: '/animals' },
      { name: 'Shed Log', baseToken: 'SHED_LOG', prefix: 'SHED_LOG', icon: '📝', path: '/shed' },
      { name: 'Crossing Log', baseToken: 'CROSSING_LOG', prefix: 'CROSSING_LOG', icon: '🧬', path: '/crossing' },
      { name: 'Purchase Log', baseToken: 'PURCHASE_LOG', prefix: 'PURCHASE_LOG', icon: '📥', path: '/purchase' },
      { name: 'Sale Log', baseToken: 'SALE_LOG', prefix: 'SALE_LOG', icon: '📤', path: '/sale' },
      { name: 'Treatment Log', baseToken: 'HEALTH', prefix: 'HEALTH', icon: '🩺', path: '/treatment' },
      { name: 'Vaccination Log', baseToken: 'HEALTH', prefix: 'HEALTH', icon: '💉', path: '/vaccination' },
      { name: 'Feed Inventory', baseToken: 'INVENTORY', prefix: 'INVENTORY', icon: '🌾', path: '/feed-inventory' },
      { name: 'Medicine Inventory', baseToken: 'INVENTORY', prefix: 'INVENTORY', icon: '💊', path: '/medicine-inventory' },
      { name: 'Grass Collection', baseToken: 'GRASS', prefix: 'GRASS', icon: '🌿', path: '/grass' },
      { name: 'Daily Feeding', baseToken: 'FEEDING', prefix: 'FEEDING', icon: '🍽️', path: '/feeding' },
      { name: 'Daily Milk Collection', baseToken: 'MILK', prefix: 'MILK', icon: '🥛', path: '/milk' },
      { name: 'Milk QA', baseToken: 'MILK', prefix: 'MILK', icon: '🧪', path: '/milk-quality' },
      { name: 'Milk Procurement', baseToken: 'MILK', prefix: 'MILK', icon: '🥛', path: '/milk-procurement' },
      { name: 'Milk Performance', baseToken: 'MILK', prefix: 'MILK_PERFORMANCE', icon: '📈', path: '/milking-performance' }
    ]
  }
};
