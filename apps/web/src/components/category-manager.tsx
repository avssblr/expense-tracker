"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  FolderTree,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { useRouter } from "next/navigation";

import {
  FormEvent,
  useState,
} from "react";

import type {
  CategoryTreeNode,
} from "@/types/finance";

type Props = {
  categories:
    CategoryTreeNode[];
};

type DeleteMode =
  | "category"
  | "subcategories";

export default function CategoryManager({
  categories,
}: Props) {
  const router = useRouter();

  const [name, setName] =
    useState("");

  const [parentId, setParentId] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * Editing
   */
  const [
    editingId,
    setEditingId,
  ] =
    useState<number | null>(
      null,
    );

  const [
    editingName,
    setEditingName,
  ] =
    useState("");

  /*
   * Delete dialog
   */
  const [
    deleteTarget,
    setDeleteTarget,
  ] =
    useState<
      CategoryTreeNode | null
    >(null);

  const [
    deleteMode,
    setDeleteMode,
  ] =
    useState<DeleteMode>(
      "category",
    );

  const [
    selectedChildren,
    setSelectedChildren,
  ] =
    useState<number[]>([]);

  /*
   * Category Management
   * starts collapsed.
   */
  const [
    isExpanded,
    setIsExpanded,
  ] = useState(false);

  async function readError(
    response: Response,
  ): Promise<string> {
    try {
      const data =
        await response.json();

      if (
        Array.isArray(
          data.usedCategories,
        ) &&
        data.usedCategories.length >
          0
      ) {
        return (
          `${data.error}\n\n` +
          data.usedCategories.join(
            "\n",
          )
        );
      }

      return (
        data.error ??
        "Something went wrong"
      );
    } catch {
      return "Something went wrong";
    }
  }

  /*
   * ------------------------
   * CREATE
   * ------------------------
   */
  async function addCategory(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response =
        await fetch(
          "/api/categories",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name:
                  name.trim(),

                parentId:
                  parentId === ""
                    ? null
                    : Number(
                        parentId,
                      ),
              }),
          },
        );

      if (
        response.status === 401
      ) {
        window.location.replace(
          "/login",
        );

        return;
      }

      if (!response.ok) {
        setError(
          await readError(
            response,
          ),
        );

        return;
      }

      setName("");
      setParentId("");

      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  /*
   * ------------------------
   * EDIT
   * ------------------------
   */
  function beginEdit(
    id: number,
    currentName: string,
  ) {
    setEditingId(id);

    setEditingName(
      currentName,
    );

    setError(null);
  }

  async function saveEdit(
    id: number,
  ) {
    if (
      !editingName.trim()
    ) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response =
        await fetch(
          `/api/categories/${id}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name:
                  editingName.trim(),
              }),
          },
        );

      if (
        response.status === 401
      ) {
        window.location.replace(
          "/login",
        );

        return;
      }

      if (!response.ok) {
        setError(
          await readError(
            response,
          ),
        );

        return;
      }

      setEditingId(null);

      setEditingName("");

      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  /*
   * ------------------------
   * DELETE DIALOG
   * ------------------------
   */
  function openDeleteDialog(
    category:
      CategoryTreeNode,
  ) {
    setDeleteTarget(
      category,
    );

    setDeleteMode(
      "category",
    );

    setSelectedChildren([]);

    setError(null);
  }

  function closeDeleteDialog() {
    if (saving) {
      return;
    }

    setDeleteTarget(null);

    setSelectedChildren([]);

    setDeleteMode(
      "category",
    );
  }

  function toggleChild(
    childId: number,
  ) {
    setSelectedChildren(
      (current) =>
        current.includes(
          childId,
        )
          ? current.filter(
              (id) =>
                id !==
                childId,
            )
          : [
              ...current,
              childId,
            ],
    );
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    if (
      deleteMode ===
        "subcategories" &&
      selectedChildren.length ===
        0
    ) {
      setError(
        "Select at least one subcategory to delete.",
      );

      return;
    }

    setSaving(true);
    setError(null);

    try {
      const body =
        deleteMode ===
        "category"
          ? {
              mode:
                "category",
            }
          : {
              mode:
                "subcategories",

              subcategoryIds:
                selectedChildren,
            };

      const response =
        await fetch(
          `/api/categories/${deleteTarget.id}/delete`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                body,
              ),
          },
        );

      if (
        response.status === 401
      ) {
        window.location.replace(
          "/login",
        );

        return;
      }

      if (!response.ok) {
        setError(
          await readError(
            response,
          ),
        );

        return;
      }

      setDeleteTarget(null);
      setSelectedChildren([]);
      setDeleteMode("category");

      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  /*
   * ------------------------
   * CATEGORY ROW
   * ------------------------
   */
  function categoryRow(
    id: number,
    categoryName: string,
    child = false,
    rootCategory?:
      CategoryTreeNode,
  ) {
    const editing =
      editingId === id;

    return (
      <div
        key={id}
        className={
          `flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 ${
            child
              ? "ml-6"
              : ""
          }`
        }
      >
        {editing ? (
          <input
            autoFocus
            value={
              editingName
            }
            onChange={(
              event,
            ) =>
              setEditingName(
                event.target
                  .value,
              )
            }
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
        ) : (
          <div className="flex items-center gap-2">
            {child && (
              <span className="text-gray-400">
                ↳
              </span>
            )}

            <span className="font-medium text-gray-800">
              {categoryName}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1">
          {editing ? (
            <>
              <button
                type="button"
                disabled={
                  saving
                }
                onClick={() =>
                  saveEdit(
                    id,
                  )
                }
                aria-label="Save category"
                title="Save"
                className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
              >
                <Check
                  size={17}
                />
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingId(
                    null,
                  );

                  setEditingName(
                    "",
                  );
                }}
                aria-label="Cancel editing"
                title="Cancel"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X
                  size={17}
                />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() =>
                  beginEdit(
                    id,
                    categoryName,
                  )
                }
                aria-label={`Edit ${categoryName}`}
                title="Rename"
                className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50"
              >
                <Pencil
                  size={16}
                />
              </button>

              {/*
                Delete appears ONLY
                for root categories.
              */}
              {!child &&
                rootCategory && (
                  <button
                    type="button"
                    onClick={() =>
                      openDeleteDialog(
                        rootCategory,
                      )
                    }
                    aria-label={`Delete ${categoryName}`}
                    title="Delete"
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                  >
                    <Trash2
                      size={16}
                    />
                  </button>
                )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="rounded-2xl bg-white shadow-sm">
        {/*
         * COLLAPSIBLE HEADER
         */}
        <button
          type="button"
          onClick={() =>
            setIsExpanded(
              (current) => !current,
            )
          }
          className="flex w-full items-center justify-between gap-4 p-5 text-left"
          aria-expanded={isExpanded}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-100 p-2 text-indigo-600">
              <FolderTree
                size={21}
                aria-hidden="true"
              />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Category Management
              </h2>

              <p className="text-sm text-gray-500">
                Add, rename and organize household expense categories.
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 p-2 text-gray-500">
            {isExpanded ? (
              <ChevronUp
                size={20}
                aria-hidden="true"
              />
            ) : (
              <ChevronDown
                size={20}
                aria-hidden="true"
              />
            )}
          </div>
        </button>

        {/*
         * COLLAPSIBLE CONTENT
         */}
        {isExpanded && (
          <div className="border-t border-gray-100 p-5">
            {/*
             * ADD CATEGORY
             */}
            <form
              onSubmit={
                addCategory
              }
              className="grid gap-3 rounded-xl bg-indigo-50/60 p-4 md:grid-cols-[1fr_1fr_auto]"
            >
              <input
                value={name}
                onChange={(
                  event,
                ) =>
                  setName(
                    event.target
                      .value,
                  )
                }
                placeholder="Category name"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />

              <select
                value={
                  parentId
                }
                onChange={(
                  event,
                ) =>
                  setParentId(
                    event.target
                      .value,
                  )
                }
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
              >
                <option value="">
                  Root category
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={
                        category.id
                      }
                      value={
                        category.id
                      }
                    >
                      Under{" "}
                      {
                        category.name
                      }
                    </option>
                  ),
                )}
              </select>

              <button
                type="submit"
                disabled={
                  saving ||
                  !name.trim()
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <Plus
                  size={17}
                />

                Add
              </button>
            </form>

            {/*
             * NORMAL ERROR
             */}
            {error &&
              !deleteTarget && (
                <div
                  role="alert"
                  className="mt-4 whitespace-pre-line rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

            {/*
             * CATEGORY LIST
             */}
            <div className="mt-6 space-y-3">
              {categories.length ===
              0 ? (
                <p className="py-6 text-center text-sm text-gray-500">
                  No categories created yet.
                </p>
              ) : (
                categories.map(
                  (category) => (
                    <div
                      key={
                        category.id
                      }
                      className="space-y-2"
                    >
                      {categoryRow(
                        category.id,
                        category.name,
                        false,
                        category,
                      )}

                      {category.children.map(
                        (child) =>
                          categoryRow(
                            child.id,
                            child.name,
                            true,
                          ),
                      )}
                    </div>
                  ),
                )
              )}
            </div>
          </div>
        )}
      </section>

      {/*
       * DELETE DIALOG
       *
       * Keep this outside the
       * collapsible content.
       */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900">
              Delete from &quot;
              {
                deleteTarget.name
              }
              &quot;
            </h2>

            {deleteTarget
              .children
              .length > 0 ? (
              <>
                <p className="mt-2 text-sm text-gray-600">
                  Choose what you want to delete.
                </p>

                <div className="mt-6 space-y-4">
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4">
                    <input
                      type="radio"
                      name="delete-mode"
                      checked={
                        deleteMode ===
                        "category"
                      }
                      onChange={() =>
                        setDeleteMode(
                          "category",
                        )
                      }
                      className="mt-1"
                    />

                    <div>
                      <p className="font-semibold text-gray-900">
                        Delete entire category
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        This will delete{" "}
                        &quot;
                        {
                          deleteTarget.name
                        }
                        &quot; and all{" "}
                        {
                          deleteTarget
                            .children
                            .length
                        }{" "}
                        subcategories.
                      </p>
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4">
                    <input
                      type="radio"
                      name="delete-mode"
                      checked={
                        deleteMode ===
                        "subcategories"
                      }
                      onChange={() =>
                        setDeleteMode(
                          "subcategories",
                        )
                      }
                      className="mt-1"
                    />

                    <div>
                      <p className="font-semibold text-gray-900">
                        Delete selected subcategories only
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        The main category will remain.
                      </p>
                    </div>
                  </label>
                </div>

                {deleteMode ===
                  "subcategories" && (
                  <div className="mt-5 rounded-xl bg-gray-50 p-4">
                    <p className="mb-3 text-sm font-semibold text-gray-700">
                      Select subcategories
                    </p>

                    <div className="space-y-3">
                      {deleteTarget.children.map(
                        (
                          child,
                        ) => (
                          <label
                            key={
                              child.id
                            }
                            className="flex cursor-pointer items-center gap-3"
                          >
                            <input
                              type="checkbox"
                              checked={selectedChildren.includes(
                                child.id,
                              )}
                              onChange={() =>
                                toggleChild(
                                  child.id,
                                )
                              }
                            />

                            <span className="text-sm text-gray-800">
                              {
                                child.name
                              }
                            </span>
                          </label>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="mt-3 text-sm text-gray-600">
                Delete &quot;
                {
                  deleteTarget.name
                }
                &quot;?
                This action cannot be undone.
              </p>
            )}

            <div className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Categories that already contain expenses cannot be deleted.
            </div>

            {error && (
              <div
                role="alert"
                className="mt-4 whitespace-pre-line rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={
                  saving
                }
                onClick={
                  closeDeleteDialog
                }
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  saving ||
                  (deleteMode ===
                    "subcategories" &&
                    selectedChildren.length ===
                      0)
                }
                onClick={
                  confirmDelete
                }
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {saving
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}