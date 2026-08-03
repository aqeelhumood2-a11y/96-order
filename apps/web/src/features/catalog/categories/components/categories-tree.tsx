import type { Category } from "@/core/catalog/entities";
import { DeleteCategoryButton } from "./delete-category-button";

interface CategoryNode extends Category {
  children: CategoryNode[];
}

function buildTree(categories: Category[]): CategoryNode[] {
  const nodes = new Map<string, CategoryNode>(categories.map((category) => [category.id, { ...category, children: [] }]));
  const roots: CategoryNode[] = [];

  for (const node of nodes.values()) {
    if (node.parentId && nodes.has(node.parentId)) {
      nodes.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function CategoryRow({
  node,
  depth,
  canManage,
  onEdit,
}: {
  node: CategoryNode;
  depth: number;
  canManage: boolean;
  onEdit: (category: Category) => void;
}) {
  return (
    <>
      <li className="flex items-center justify-between gap-4 border-b border-brand-100 py-2" style={{ paddingLeft: depth * 20 }}>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">
            {node.name} {!node.isActive && <span className="text-xs text-foreground/65">(inactive)</span>}
          </span>
          <span className="text-xs text-foreground/65">/{node.slug}</span>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onEdit(node)} className="text-sm text-brand-700 hover:underline">
              Edit
            </button>
            <DeleteCategoryButton categoryId={node.id} />
          </div>
        )}
      </li>
      {node.children.map((child) => (
        <CategoryRow key={child.id} node={child} depth={depth + 1} canManage={canManage} onEdit={onEdit} />
      ))}
    </>
  );
}

export function CategoriesTree({
  categories,
  canManage,
  onEdit,
}: {
  categories: Category[];
  canManage: boolean;
  onEdit: (category: Category) => void;
}) {
  const tree = buildTree(categories);

  if (categories.length === 0) {
    return <p className="text-sm text-foreground/69">No categories yet.</p>;
  }

  return (
    <ul className="flex flex-col">
      {tree.map((node) => (
        <CategoryRow key={node.id} node={node} depth={0} canManage={canManage} onEdit={onEdit} />
      ))}
    </ul>
  );
}
