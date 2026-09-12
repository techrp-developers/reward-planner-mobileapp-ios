// Module icons are fetched once via CmsAppShellContext (GET
// /content/resolved/modules); this type alias keeps existing navbar imports
// working without duplicating the shape.
export type { CmsModule as ApiModuleIcon } from "../../modules/common/cms/cmsContentApi";
