// This is the corrected code that needs to replace lines 786-803 in UserManagement.jsx

) : activeTab === 'pending' ? (
    pendingUsers.map(user => (
        <TableRow key={user.id}>
            <TableCell className="font-medium">{user.full_name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.user_role}</TableCell>
            <TableCell>{user.department}</TableCell>
            <TableCell>{getStatusBadge(user.approval_status)}</TableCell>
            <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => handleEditPendingUser(user)}>Edit</Button>
                    <Button size="sm" variant="default" onClick={() => handleApproveUser(user)} className="bg-green-600 hover:bg-green-700">Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleRejectUser(user)}>Reject</Button>
                </div>
            </TableCell>
        </TableRow>
    ))
) : (
    <TableRow>
        <TableCell colSpan="6">No data available</TableCell>
    </TableRow>
)}
