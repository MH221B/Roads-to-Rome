import { FaSearch } from "react-icons/fa";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CourseFilterBar() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
        <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
          <Select defaultValue="recent-accessed">
            <SelectTrigger className="w-48 font-bold">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent-accessed">Recently Accessed</SelectItem>
              <SelectItem value="recent-enrolled">Recently Enrolled</SelectItem>
              <SelectItem value="a-z">Title: A-to-Z</SelectItem>
              <SelectItem value="z-a">Title: Z-to-A</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-36 font-bold">
              <SelectValue placeholder="Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dev">Development</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-36 font-bold">
              <SelectValue placeholder="Progress" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not-started">Not Started</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-36 font-bold">
              <SelectValue placeholder="Instructor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="john">John Doe</SelectItem>
              <SelectItem value="jane">Jane Smith</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            className="text-muted-foreground font-bold hover:text-foreground hover:bg-transparent px-2"
            onClick={() => console.log("Reset filters")}
          >
            Reset
          </Button>
        </div>

        <div className="flex w-full md:w-auto items-center">
          <div className="flex w-full max-w-sm items-center space-x-0">
            <Input
              type="text"
              placeholder="Search my courses"
              className="w-full md:w-64 rounded-r-none border-r-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button className="rounded-l-none bg-primary text-primary-foreground hover:bg-primary/90 px-4">
              <FaSearch className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
