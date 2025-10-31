<script>
	import Sidebar from '$lib/components/sidebar.svelte';
	import FloatingButton from "$lib/components/FloatingButton.svelte";

const executives = [
  { id: 1, name: 'Entebus Admin', phone: '9876543210', gender: 'Male' },
  { id: 2, name: 'Entebus Guest', phone: '9876501234', gender: 'Female' },
];

  function handleAdd() {
    alert('Add new item');
  }
</script>

<!-- Layout -->
<div class="d-flex">
	<Sidebar />

	<main class="flex-grow-1 ml-auto vh-100 p-3">
    <div class="container-fluid d-none d-md-flex align-items-center justify-content-between p-3">
  <h4 class="fw-bold text-dark mb-0">Account Management</h4>

  <div class="d-flex align-items-center gap-2">
    <!-- Multi-select Dropdown -->
    <div class="dropdown">
      <button
        class="btn selection-button btn-outline-secondary dropdown-toggle"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        Select Columns
      </button>

      <ul class="dropdown-menu p-2" style="min-width: 200px;">
        <li class="form-check">
          <input class="form-check-input" type="checkbox" id="col-email" />
          <label class="form-check-label" for="col-email">Email</label>
        </li>
        <li class="form-check">
          <input class="form-check-input" type="checkbox" id="col-designation" />
          <label class="form-check-label" for="col-designation">Designation</label>
        </li>
        <li class="form-check">
          <input class="form-check-input" type="checkbox" id="col-status" />
          <label class="form-check-label" for="col-status">Status</label>
        </li>
      </ul>
    </div>

    <!-- Add Button -->
    <button class="btn  create-button">Add Executive</button>
  </div>
</div>


		<!-- Desktop View -->
    <div>
		<div class="card d-none d-md-block p-3">
			<table class="table align-middle mb-0">
				<thead>
					<tr>
						<th>ID</th>
						<th>Full Name</th>
						<th>Phone</th>
						<th>Gender</th>
					</tr>
					<tr>
						<td><input class="form-control" placeholder="Search" /></td>
						<td><input class="form-control" placeholder="Search" /></td>
						<td><input class="form-control" placeholder="Search" /></td>
						<td>
            <select class="form-select custom-select">
              <option>All</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </td>
					</tr>
				</thead>
				<tbody>
					{#each executives as exec}
						<tr>
							<td>{exec.id}</td>
							<td>{exec.name}</td>
							<td>{exec.phone}</td>
							<td>{exec.gender}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
    </div>
		<!-- Mobile View -->
		<div class="d-md-none pt-5">
			<input type="text" class="form-control mb-3" placeholder="Search executives..." />
			{#each executives as exec}
				<div class="card border-0  mb-3 p-3 shadow-sm">
					<div class="d-flex align-items-center">
						<div
							class="icon rounded-circle d-flex justify-content-center align-items-center me-3"
							style="width:40px; height:40px; background-color:#e8f5e9;"
						>
							<i class="bi bi-person fs-4 text-success"></i>
						</div>
						<div>
							<h6 class="mb-1 fw-inter-700">{exec.name}</h6>
							<small class="text-muted">ID: {exec.id}</small>
						</div>
					</div>
					<hr class="my-2" />
					<div class="d-flex justify-content-between text-muted small">
						<div><i class="bi bi-telephone me-1"></i>{exec.phone}</div>
						<div><i class="bi bi-gender-ambiguous me-1"></i>{exec.gender}</div>
					</div>
				</div>
			{/each}
    <FloatingButton onClick={handleAdd} tooltip="Add new item" />
		</div>
	</main>
</div>

<style>
	/* Adjust main content beside the sidebar */
	main {
		background-color: #f7f9fc;
		transition: margin-left 0.3s ease;
	}
	/* Example: if your sidebar width is 250px */
	@media (min-width: 768px) {
		main {
			margin-left: 250px;
		}
	}
.form-check-input:checked {
  background-color: #28a745 !important;  /* green fill */
  border-color: #28a745 !important;
}
.custom-select:focus {
  border-color: #28a745;
  box-shadow: 0 0 0 0.25rem rgba(40, 167, 69, 0.25);
}

/* Change background color of selected option */
.custom-select option:checked {
  background-color: #28a745 !important;
  color: white;
}

/* Change hover color (works in Chrome/Edge, not Firefox) */
.custom-select option:hover {
  background-color: #28a745 !important;
  color: white;
}
</style>
