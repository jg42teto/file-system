export interface FileSystemObject {
    id: number;
    disk_id: number;
    parent_id: number;
    kind: string;
    name: string;
    size: bigint;
    create_dt: Date;
    deleted_dt: Date | null;
}

export interface FileObject extends FileSystemObject {
    url: string;
}

export interface Folder extends FileSystemObject {
    children_files_number: number;
    total_files_number: number;
}

export class FolderContent {
    folders: Folder[] = [];
    files: FileObject[] = [];
    static add(fc: FolderContent, fso: FileSystemObject): void {
        if (fso.kind === 'file')
            fc.files.push(fso as FileObject)
        else if (fso.kind === 'fold')
            fc.folders.push(fso as Folder)
    }
    static remove(fc: FolderContent, fso: FileSystemObject): void {
        if (fso.kind === 'file')
            fc.files = fc.files.filter(x => x.id !== fso.id)
        else if (fso.kind === 'fold')
            fc.folders = fc.folders.filter(x => x.id !== fso.id)
    }
}