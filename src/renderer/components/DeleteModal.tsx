import { User } from "@renderer/pages/AdminPage";
interface Props {
    user: User;
    onClose: () => void;
    onDelete: () => void;
}

export function DeleteModal({ user, onClose, onDelete }: Props) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/10">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-sm">
                <h3 className="text-neutral-900 text-lg font-semibold">
                    Remove user
                </h3>
                <p className="mt-2 text-sm text-neutral-600">
                    This will remove <span className="font-medium">{user.email}</span> from
                    the system. This action can be reversed by re-adding the user.
                </p>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="rounded-lg bg-neutral-100 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-200/60 transition-all duration-200"
                    >
                        Cancel
                    </button>
                    <button className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white shadow-sm hover:bg-neutral-800 transition-all duration-200">
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}
