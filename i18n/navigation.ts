import { routing } from "@/i18n/routing";
import { createNavigation } from "next-intl/navigation";

export const { Link, usePathname } = createNavigation(routing);
